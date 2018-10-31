import os
import pinyin
import re
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import yaml
import logging
import tornado.gen
import time
from utils import signature
import random
import string

MAX_NAME = 50

try:
    import pygit2
except:
    pass

request_log = logging.getLogger('purus.request')

login_re = re.compile('^[0-9a-zA-Z]{4,12}$')


def get_initial(str):
    py = pinyin.get_initial(str).lower()
    for c in '(),- /':
        py = py.replace(c, '')
    return py


def gen_key(size, chars=None):
    if chars is None:
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits

    return ''.join(random.choice(chars) for _ in range(size))


def clen(text):
    if text is None:
        return 4

    if type(text) is int:
        return len(str(text))

    if type(text) is bool:
        return len(str(text))

    l = 0
    for c in text:
        if ord(c) < 128:
            l += 1
        else:
            l += 2
    return l


class ConfigRepo():
    def __init__(self, cfg):
        assert cfg.get('path')

        self.repo_path = cfg.get('path')
        self.meta = None
        self.downstream = list()
        self.user = list()
        self.role = dict()
        self.template = None
        self.product = None  # lazy loading
        self.product_dict = None  # lazy loading
        self.special = None
        self.level_name = dict()
        self.load()

        try:
            self.git_repo = pygit2.init_repository(self.repo_path, False)
        except:
            self.git_repo = None

    """
    Loading
    """

    def reload(self):
        self.meta = None
        self.downstream = list()
        self.user = list()
        self.role = dict()
        self.template = None
        self.product = None  # lazy loading
        self.product_dict = None  # lazy loading
        self.special = None
        self.level_name = dict()
        self.load()

    def load(self):
        self.meta = self.load_yaml('meta.yaml', True)

        d = self.load_yaml('downstream.yaml')
        if d and 'downstream' in d:
            self.downstream = d.get('downstream')
        else:
            self.downstream = list()

        u = self.load_yaml('user.yaml')
        if u and 'user' in u:
            self.user = u.get('user')
        else:
            self.user = list()

        r = self.load_yaml('role.yaml')
        if r and 'role' in r:
            self.role = r.get('role')
        else:
            self.role = dict()

        self.template = self.load_yaml('template.yaml', True)

        self.level_name = self.load_yaml('level_name.yaml')

        self.get_special()

        for k in self.meta['sites']:
            request_log.info('LOADING %10s - %40s %40s', k,
                             self.meta['sites'][k].get('sync.url', '<Publish Disabled>'),
                             self.meta['sites'][k].get('pricing.url', '<Publish Disabled>'))

    def load_yaml(self, file, forced=False):
        try:
            return yaml.load(open(os.path.join(self.repo_path, file), 'r', encoding='utf8'))
        except FileNotFoundError as e:
            if forced:
                raise e

        return dict()

    """
    Saving
    """

    def save_native_yaml(self, file, data):
        path = os.path.join(self.repo_path, file)
        yaml.dump(data, open(path, 'w', encoding='utf8'))

    def save_dict_yaml(self, file, head, data):
        path = os.path.join(self.repo_path, file)
        try:
            with open(path, 'w', encoding='utf8') as f:
                f.write('%s:\n' % head)

                for key in sorted(data):
                    f.write('  %s:\n' % key)

                    s = data.get(key)

                    for v in sorted(s):
                        f.write('    - %s\n' % v)

        except Exception as e:
            request_log.exception('SAVE FAIL')

    def save_list_yaml(self, file, head, data, key_list):
        path = os.path.join(self.repo_path, file)

        try:
            padding = max([len(k) for k in key_list])

            with open(path, 'w', encoding='utf8') as f:
                f.write('%s:\n' % head)

                for d in data:

                    for i in range(len(key_list)):
                        key = key_list[i]
                        v = d.get(key)
                        head = i == 0 and '  - ' or '    '
                        if v is None:
                            f.write("{0}{1}{2}: ''\n".format(
                                head, key, ' ' * (padding - len(key))))
                        elif type(v) == bool:
                            f.write("{0}{1}{2}: {3}\n".format(
                                head, key, ' ' * (padding - len(key)), v and 'true' or 'false'))
                        elif type(v) == int:
                            f.write("{0}{1}{2}: {3}\n".format(
                                head, key, ' ' * (padding - len(key)), v))
                        else:
                            f.write("{0}{1}{2}: '{3}'\n".format(
                                head, key, ' ' * (padding - len(key)), v))

                    f.write("\n")

        except Exception as e:
            request_log.exception('SAVE FAIL')

    def save(self, flag='all'):
        if flag == 'all' or flag == 'downstream':
            # file, head, data, key_list
            self.save_list_yaml('downstream.yaml', 'downstream', self.downstream,
                                ['id', 'name', 'master_id', 'shard_id', 'sharding', 'type', 'ui', 'core', 'pass', 'iv',
                                 'key', 'back_url', 'content', 'tags', 'plevel', 'prefix',
                                 'status', 'tsp', 'cooperation', 'qq', 'mobile', 'notes'])

        if flag == 'all' or flag == 'user':
            self.save_list_yaml('user.yaml', 'user', self.user,
                                ['id', 'login', 'name', 'password', 'role', 'user_id', 'status'])

        if flag == 'all' or flag == 'role':
            self.save_dict_yaml('role.yaml', 'role', self.role)

        if flag == 'product':
            self.save_list_yaml('product.yaml', 'product', self.product,
                                ['id', 'name', 'type', 'carrier', 'price', 'area', 'use_area', 'status', 'value',
                                 'notes', 'tsp', 'p1', 'p2', 'p3', 'p4', 'p5',
                                 'scope', 'legacy', 'routing'])

    """
    Get/set
    """

    def get_template(self, key):
        return self.template.get(key).get('define')

    def get_downstream(self, user_id):
        for d in self.downstream:
            if d.get('id') == user_id:
                return d

    def get_product(self):

        if self.product is None:
            p = self.load_yaml('product.yaml')
            self.product = p.get('product', [])
            self.product_map = dict()
            for p in self.product:
                self.product_map[p['id']] = p

        return self.product

    def get_product_user(self, user_id):
        all_product = self.get_product()
        s = self.get_special().get(user_id, {})

        product_list = []
        for p in all_product:
            p1 = p.copy()
            s1 = s.get(p1['id'])

            if p1['status'] == 'disabled':
                p1['status'] = 'n/a'
            elif s1 and s1.get('status') == 'disabled':
                p1['status'] = 'disabled'

            product_list.append(p1)

        return product_list

    def get_level_name(self):
        return self.level_name

    def set_level_name(self, level_name):
        if len(level_name) == len(self.level_name):
            self.level_name = level_name
            self.save_native_yaml('level_name.yaml', level_name)

    def get_special(self):

        if self.special is None:
            self.special = dict()

            for d in self.downstream:
                user_id = d['id']
                request_log.info('Loading special_%s.yaml', user_id)

                sp = self.load_yaml('special_%s.yaml' % user_id)
                self.special[user_id] = sp

        return self.special

    """
    Entity Adding
    """

    def valid_downstream(self, downstream):
        name = downstream['name']
        if len(name) < 2 or len(name) > MAX_NAME:
            raise ValueError('代理商名称长度不符合要求(2-%d字符) (%s)' % (MAX_NAME, name))

        for d in self.downstream:
            if d['name'] == name:
                raise ValueError('代理商用户名已经存在 (%s)' % name)

    def valid_user(self, user):
        login = user['login']
        if not login_re.match(login):
            raise ValueError('登录名不符合规则：小写字母或数字长度4~12位')

        for d in self.user:
            if d['login'] == login:
                raise ValueError('登录名已经存在 (%s)' % login)

    def add_downstream(self, downstream, template_id, user=None):

        # init check
        self.valid_downstream(downstream)
        if user:
            self.valid_user(user)

        t = self.template.get('downstream')

        if template_id not in t:
            raise ValueError('无效的用户定义模板 (%s)' % template_id)

        downstream_s = t.get(template_id).copy()

        for key in downstream_s:
            if key in downstream:
                downstream_s[key] = downstream[key]

        # checking
        if downstream_s.get('name') is None:
            raise ValueError('用户名为空')

        # auto id
        auto_id = int(downstream_s.get('id') or 100000)

        for k in self.downstream:
            last_id = int(k['id'])
            if last_id < auto_id:
                continue
            elif last_id == auto_id:
                auto_id += 1
                continue
            else:
                break

        downstream_s['id'] = str(auto_id)

        # checking again ...
        for d in self.downstream:
            if d['id'] == downstream_s['id']:
                raise ValueError('重复的用户ID (%s)' % downstream_s['id'])

        # some staff
        if downstream_s.get('type') == 'data-seller':
            if 'pass' in downstream and 'iv' in downstream:
                downstream_s['pass'] = downstream.get('pass')
                downstream_s['iv'] = downstream.get('iv')
            else:
                downstream_s['pass'] = gen_key(16, string.ascii_uppercase + string.ascii_lowercase + string.digits)
                downstream_s['iv'] = gen_key(16, string.digits)

        elif downstream_s.get('type') == 'fee-agent':
            if 'key' in downstream:
                downstream_s['key'] = downstream.get('key')
            else:
                downstream_s['key'] = gen_key(32, string.ascii_uppercase + string.ascii_lowercase + string.digits)

        if not downstream_s.get('master_id'):
            downstream_s['master_id'] = downstream_s['id']

        if not downstream_s.get('shard_id'):
            downstream_s['shard_id'] = downstream_s['master_id']

        # auto pinyin initial
        downstream_s['tags'] = get_initial(downstream_s['name'])
        # default
        downstream_s['tsp'] = int(time.mktime(time.localtime()))
        downstream_s['status'] = 'enabled'

        # add & sort
        self.downstream.append(downstream_s)
        self.downstream = sorted(self.downstream, key=lambda x: '%05d' % int(x['id']))

        # save
        self.save('downstream')

        if user:
            user['user_id'] = downstream_s['id']
            self.add_user(user, template_id)

        return downstream_s

    def add_role(self, role_set, role):
        r = self.role.get(role_set)
        if r is None:
            r = self.role[role_set] = list()
        if role not in r:
            r.append(role)

    def add_user(self, user, template_id):
        t = self.template.get('user')

        if template_id not in t:
            raise ValueError('无效的用户定义模板 (%s)' % template_id)

        user_s = t.get(template_id).copy()

        # template & copy
        for key in user_s:
            if key in user:
                user_s[key] = user[key]

        # 1st check
        for u in self.user:
            if u['login'] == user_s['login']:
                raise ValueError('重复的登录名 (%s)' % u['login'])

        # auto id
        if user_s.get('id') is None:
            user_id = 1
            for u in self.user:
                if int(u['id']) > user_id:
                    user_id = int(u['id'])

            user_s['id'] = str(user_id + 1)

        # 2nd check...
        for u in self.user:
            if u['id'] == user_s['id']:
                raise ValueError('重复的用户ID (%s)' % user_s['id'])

        # add & sort
        self.user.append(user_s)
        self.user = sorted(self.user, key=lambda u: '%s%05d' % (u['user_id'], int(u['id'])))
        self.save('user')

    def update_downstream(self, downstream_id, name=None, back_url=None, master_id=None, plevel=None, status=None):
        downstream = None
        for d in self.downstream:
            if d['id'] == downstream_id:
                downstream = d
                break

        if downstream is None:
            raise ValueError('无效的代理商 (%s)' % downstream_id)

        if name and downstream['name'] != name:
            if len(name) < 2 or len(name) > MAX_NAME:
                raise ValueError('代理商名称长度不符合要求(2-%s字符) (%s)' % (MAX_NAME, name))

            for d in self.downstream:
                if d['name'] == name and d['id'] != downstream_id:
                    raise ValueError('代理商用户名已经存在 (%s)' % name)

            downstream['name'] = name
            downstream['tags'] = get_initial(name)  # auto pinyin initial

        if back_url and downstream['back_url'] != back_url:
            downstream['back_url'] = back_url

        if master_id and downstream['master_id'] != master_id:
            downstream['master_id'] = master_id

        if plevel and downstream['plevel'] != plevel:
            downstream['plevel'] = plevel

        if status and downstream['status'] != status:
            downstream['status'] = status

        self.save('downstream')

    def update_product(self, product_id, value, status, plevel=None):
        try:
            changed = False

            product = next(p for p in self.get_product() if p['id'] == product_id)

            if value:
                product['value'] = value
                changed = True

            if status:
                product['status'] = status
                changed = True

            if plevel:
                for i in range(1, 6):
                    if plevel[i - 1] is not None:
                        product['p%d' % i] = plevel[i - 1]
                        changed = True

            if changed:
                self.save('product')

            return product
        except StopIteration:
            pass
        except Exception as e:
            request_log.exception('UPDATE PRODUCT')

    def remove_special(self, user_id, product_id):
        special = self.get_special()
        user_special = special.get(user_id)

        if product_id in user_special:
            del user_special[product_id]['value']
            self.save_native_yaml('special_%s.yaml' % user_id, user_special)

    def add_special(self, user_id, product_id, value=None, status=None):
        is_new = False
        special = self.get_special()
        user_special = special.get(user_id, {})

        if product_id in user_special:
            data = user_special.get(product_id)
            is_new = False
        else:
            data = {'notes': ''}
            is_new = True

        if value:
            data['value'] = value
        if status:
            data['status'] = status

        user_special[product_id] = data

        self.save_native_yaml('special_%s.yaml' % user_id, user_special)

        return data, is_new

    """
    Publishing
    """

    def publish_purus(self, site_id):
        down_set = set()

        ##### DOWNSTREAM #####
        text = 'downstream:\n'

        name_padding = 10
        for d in self.downstream:
            l = clen(d.get('name'))
            name_padding = max(l, name_padding)

        for d in self.downstream:
            if d.get('ui') != site_id:
                continue

            if d.get('status') == 'disabled':
                continue

            down_set.add(d.get('id'))
            if d['type'] == 'data-seller':
                text += "  '%s': { name: '%s', %s shard_id: '%s', master: '%s', shard: '%s', pass: '%s', iv: '%s', tags: '%s' }\n" % (
                    d.get('id'),
                    d.get('name'),
                    ' ' * (name_padding - clen(d.get('name'))),
                    d.get('shard_id') or d.get('master_id'),
                    d.get('master_id'),
                    d.get('sharding'),
                    d['pass'],
                    d['iv'],
                    d.get('tags'))
            else:
                text += "  '%s': { name: '%s', %s shard_id: '%s', master: '%s', shard: '%s', tags: '%s' }\n" % (
                    d.get('id'),
                    d.get('name'),
                    ' ' * (name_padding - clen(d.get('name'))),
                    d.get('shard_id') or d.get('master_id'),
                    d.get('master_id'),
                    d.get('sharding'),
                    d.get('tags'))

        ##### USER #####
        text += '\nuser:\n'

        login_padding = 1
        name_padding = 10
        for u in self.user:
            name_padding = max(clen(u.get('name')), name_padding)
            login_padding = max(len(u.get('login')), login_padding)

        for u in self.user:
            if u['user_id'] not in down_set:
                continue

            text += " '%s'%s: { login: '%s',%s user_id: '%s', role: '%s',%s name: '%s',%s password: '%s'}\n" % (
                u.get('id'),
                ' ' * (4 - len(str(u.get('id')))),
                u.get('login'),
                ' ' * (login_padding - len(u.get('login'))),
                u.get('user_id'),
                u.get('role'),
                ' ' * (14 - len(u.get('role'))),
                u.get('name'),
                ' ' * (name_padding - clen(u.get('name'))),
                u.get('password'),
            )

        ##### ROLE #####
        text += '\nrole:\n'

        for key in sorted(self.role):
            text += '  %s:\n' % key

            s = self.role.get(key)

            for v in sorted(s):
                text += '    - %s\n' % v
        text += '\n'

        return text

    def publish_huallaga(self, site_id):
        down_set = set()

        ##### DOWNSTREAM #####
        text = 'upstream:\n'

        for d in self.downstream:
            if d.get('status') == 'disabled':
                continue

            if d.get('pass') is None:
                continue

            text += "  '%s':\n" % d.get('id')
            text += "      pass: '%s'\n" % d.get('pass')
            text += "      iv: '%s'\n" % d.get('iv')
            text += "      order.url: 'http://%s/data/order'\n" % d.get('sharding')

        return text

    def publish_madeira(self, site_id):

        text = 'downstream:\n'

        name_padding = 10
        for d in self.downstream:
            l = clen(d.get('name'))
            name_padding = max(l, name_padding)

        for d in self.downstream:
            if d.get('core') != site_id:
                continue

            if d.get('status') == 'disabled':
                continue

            if d.get('type') == 'fee-agent':
                text += "  '%s': { name: '%s', %s shard: '%s', master: '%s', key: '%s' }\n" % (
                    d.get('id'),
                    d.get('name'),
                    ' ' * (name_padding - clen(d.get('name'))),
                    d.get('shard_id') or d.get('master_id'),
                    d.get('master_id'),
                    d.get('key'),
                )
            else:
                c = ''
                if d.get('content'):
                    c = ", content: true"

                text += "  '%s': { name: '%s', %s shard: '%s', master: '%s', pass: '%s', iv: '%s', back_url: '%s'%s}\n" % (
                    d.get('id'),
                    d.get('name'),
                    ' ' * (name_padding - clen(d.get('name'))),
                    d.get('shard_id') or d.get('master_id'),
                    d.get('master_id'),
                    d.get('pass'),
                    d.get('iv'),
                    d.get('back_url'), c
                )

        return text

    def publish_pricing(self, p_filter=None):
        core_lines = []
        ui_lines = []

        for downstream in self.downstream:
            request_log.info('PUBLISH PRICING %s', downstream['id'])
            cl, ul = self.publish_pricing_user(downstream, p_filter)

            core_lines += cl
            ui_lines += ul

        return core_lines, ui_lines

    def publish_pricing_user(self, downstream, p_filter=None):
        core_lines = []
        ui_lines = []

        user_id = downstream['id']
        special = self.get_special().get(user_id, {})

        pricing_list = []
        routing_list = []
        product_list = []

        for product in self.get_product():

            sp = special.get(product['id'], None)

            pricing, routing, pd_line = self.get_pricing_line(product, downstream, sp)

            pricing_list.append(pricing)
            routing_list.append(routing)
            product_list.append(pd_line)

            if (p_filter is None) or (p_filter == product['id']):
                core_lines.append(pricing)
                core_lines.append(routing)
                ui_lines.append(pd_line)

        path = os.path.join(self.repo_path, 'pricing', 'pricing_%s.sh' % user_id)
        with open(path, 'w', encoding='utf8') as stream:
            stream.write('\n'.join(pricing_list))
            stream.write('\n')
            stream.write('\n'.join(routing_list))
            stream.write('\n')
            stream.write('\n'.join(product_list))

        return core_lines, ui_lines

    def get_pricing_line(self, product, downstream, special):

        enabled = True
        if (special and special.get('status') == 'disabled') or product['status'] == 'disabled':
            enabled = False

        ### PRICE ###
        if product['area'] == 'CN':
            area = ''
        else:
            area = ':' + product['area']

        if product['scope'] == '0':
            scope = ''
        else:
            scope = ':' + product['scope']

        if special and special.get('value'):
            price = special.get('value')
        else:
            plevel = downstream.get('plevel')
            price = product.get('p%s' % plevel)

        key = 'price:{user_id}:data:{carrier}{area}{scope}:{price}'.format(
            user_id=downstream['id'],
            carrier=product['carrier'],
            area=area,
            scope=scope,
            price=product['price'],
        )

        if enabled:
            value = '{value},{prefix}{code}'.format(
                value=price,
                prefix=downstream['prefix'],
                code=product['legacy'][2:],
            )

            padding = ' ' * (70 - len(key) - len(value))
            price_line = 'set %s%s%s' % (key, padding, value)
        else:
            price_line = 'del %s' % key

        ### ROUTE ###
        if product['area'] == 'CN':
            area = ''
        else:
            area = ':' + product['area']

        if product['scope'] == '0':
            scope = ''
        else:
            scope = ':' + product['scope']

        route = product.get('routing', 'test')
        # route:{user_id}:{product}:{carrier}:{area}:{price}
        key = 'route:{user_id}:data:{carrier}{area}:{price}{scope}'.format(
            user_id=downstream['id'],
            carrier=product['carrier'],
            area=area,
            scope=scope,
            price=product['price'],
        )

        if enabled:
            value = '{route},{value}'.format(
                route=route,
                value=product['value'],
            )

            padding = ' ' * (60 - len(key) - len(route))
            route_line = 'set %s%s%s' % (key, padding, value)
        else:
            route_line = 'del %s' % key

        ### PRODUCT ###
        if product['scope'] == '0':
            scope = ''
        else:
            scope = ':' + product['scope']

        route = product.get('routing', 'test')
        # route:{user_id}:{product}:{carrier}:{area}:{price}
        key = 'product:{user_id}:data:{carrier}:{area}:{price}{scope}'.format(
            user_id=downstream['id'],
            carrier=product['carrier'],
            area=product['area'],
            scope=scope,
            price=product['price'],
        )

        if enabled:
            all_values = [
                'offer', '%s%s' % (downstream['prefix'], product['legacy'][2:]),
                'carrier', '%2s' % product['carrier'],
                'value', '%5s' % product['price'],
                'discount', '%d' % (int(price) / int(product['price'])),
                'name', product['name'],
            ]

            if product['scope'] != '0':
                all_values += ['scope', product['scope']]

            padding = ' ' * (60 - len(key))
            product_line = 'hmset %s%s%s' % (key, padding, ' '.join(all_values))
        else:
            product_line = 'del   %s' % key

        return price_line, route_line, product_line

    """
    Git repository maintaining
    """

    def get_diff_to_head(self):
        msg = ''

        origin = None
        head_ref = self.git_repo.lookup_reference('refs/heads/master')
        commit = head_ref.get_object()
        tree = commit.tree

        for entry in tree:
            if entry.name == 'downstream.yaml':
                hex = entry.id

                t, data = self.git_repo.read(hex)

                origin = yaml.load(data)
                break

        #### compile
        if origin:
            s1 = set([d['name'] for d in self.downstream])
            s0 = set([d['name'] for d in origin['downstream']])
            for name in s1.difference(s0):
                msg += '增加：%s\n' % name
            for name in s0.difference(s1):
                msg += '删除：%s\n' % name

        return msg.strip()

    def commit_all(self, files=None, is_init=False, message=None):
        index = self.git_repo.index

        if type(files) == list:
            for path in files:
                index.add(path)
        else:
            index.add_all()

        index.write()

        tree = index.write_tree()

        author = pygit2.Signature('Admin', 'admin@e7chong.com')
        comitter = pygit2.Signature('Admin', 'admin@e7chong.com')

        if is_init:
            message = '初始化配置仓库'
            ref = 'HEAD'
            parents = []
        else:
            ref = 'refs/heads/master'
            parents = [self.git_repo.head.get_object().hex]

        # tree = self.git_repo.TreeBuilder().write()

        oid = self.git_repo.create_commit(
            ref,
            author,
            comitter,
            message,
            tree,
            parents)

        return oid

    def publish(self):
        for key in self.meta['sites']:
            request_log.info('PUBLISH %s' % key)

            text = ''
            publish = self.meta['sites'][key]

            publish_call = getattr(self, 'publish_' + publish['publisher'])
            text += publish_call(key)

            with open(os.path.join(self.repo_path, publish['base']), 'r', encoding='utf8') as f:
                text += ''.join(f.readlines())

            with open(os.path.join(self.repo_path, publish['filename']), 'w', encoding='utf8') as f:
                f.write(text)

    """
    Syncing
    """

    @tornado.gen.coroutine
    def sync(self):
        for key in self.meta['sites']:
            request_log.info('SYNC %s' % key)

            publish = self.meta['sites'][key]

            if 'sync.url' not in publish or 'sync.secret' not in publish:
                request_log.info('SKIP %s' % key)
                continue

            url = publish['sync.url']
            secret = publish['sync.secret']
            body = open(os.path.join(self.repo_path, publish['filename']), 'r', encoding='utf8').read()

            tsp = str(int(time.mktime(time.localtime())))
            v = signature(tsp + secret)

            http_client = AsyncHTTPClient()
            try:
                response = yield http_client.fetch(
                    HTTPRequest(url=url, method='POST', body=body, headers={'tsp': tsp, 'v': v}))

                request_log.info('SYNC RESULT %d', response.code)

            except Exception as e:
                request_log.exception("FAIL")

    @tornado.gen.coroutine
    def sync_pricing(self, core_lines, ui_lines):
        for key in self.meta['sites']:
            request_log.info('SYNC PRICING %s' % key)

            publish = self.meta['sites'][key]

            if 'pricing.url' not in publish or 'sync.secret' not in publish:
                request_log.info('SKIP %s' % key)
                continue

            url = publish['pricing.url']
            secret = publish['sync.secret']

            if publish['publisher'] == 'purus':
                body = '\n'.join(ui_lines)
            elif publish['publisher'] == 'madeira':
                body = '\n'.join(core_lines)
            else:
                request_log.info('UNKNOWN PUBLISHER %s', publish['publisher'])
                continue

            request_log.info('SYNC VIA %s' % url)

            tsp = str(int(time.mktime(time.localtime())))
            v = signature(tsp + secret)

            http_client = AsyncHTTPClient()
            try:
                response = yield http_client.fetch(
                    HTTPRequest(url=url, method='POST', body=body, headers={'tsp': tsp, 'v': v}))

                request_log.info('SYNC RESULT %d', response.code)

            except Exception as e:
                request_log.exception("FAIL")


__author__ = 'Kevin'
