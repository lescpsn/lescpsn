import json
import logging
import math
import pinyin
import random
import re
import string
import tornado.gen
from datetime import datetime as dt
from sqlalchemy import desc, or_

import core
from db.repo import RepoUser, RepoLevel, RepoTemplate, RepoOperator
from handlers import JsonHandler
from utils import sign_request

STATUS = {
    'enabled': '正常',
    'disabled': '维护',
    'n/a': '上游维护',
}


def get_initial(str):
    py = pinyin.get_initial(str).lower()
    for c in '(),- /':
        py = py.replace(c, '')
    return py


def gen_key(size, chars=None):
    if chars is None:
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits

    return ''.join(random.choice(chars) for _ in range(size))


request_log = logging.getLogger('purus.request')

MAX_NAME = 50
login_re = re.compile('^[0-9a-zA-Z]{4,12}$')


def get_user_level(session, domain_id):
    level_map = {}
    for l in session.query(RepoLevel).filter(RepoLevel.domain_id == domain_id).all():
        level_map[l.level] = l.name

    return level_map


class ApiUserHandler(JsonHandler):
    @tornado.gen.coroutine
    def get(self, path):
        if path == 'template':
            self.get_template()
            return
        if path == 'list':
            self.get_user_list()

    def get_template(self):
        domain_id = self.get_argument('domain_id')

        template_list = list()
        session = self.session('repo')

        try:
            q = session.query(RepoTemplate).filter(RepoTemplate.domain_id == domain_id)

            for t in q.all():
                template_list.append({
                    'id': t.template_id,
                    'name': t.template_name,
                })
        finally:
            session.close()

        resp = json.dumps(template_list)
        request_log.debug(resp)
        self.finish(resp)

    def get_user_list(self):
        domain_id = self.get_argument('domain_id')

        user_list = list()

        session = self.session('repo')

        try:
            q = session.query(RepoUser).filter(RepoUser.domain_id == domain_id).order_by(RepoUser.user_id)

            for u in q.all():
                user_list.append({
                    'id': u.user_id,
                    'name': u.name,
                    'tags': u.tags,
                    'plevel': u.level,
                    'master': u.master_id,
                })
        finally:
            session.close()

        self.finish(json.dumps(user_list))

    @tornado.gen.coroutine
    def post(self, path):
        if path == 'list_all':
            self.post_list_all_users()
            return
        elif path == 'by_id':
            self.post_get_by_id()
            return
        elif path == 'add':
            yield self.post_add_user()
            return
        elif path == 'add_operator':
            yield self.post_add_operator()
            return
        elif path == 'update':
            yield self.post_update_user()
            return
        elif path == 'sync':
            yield self.post_sync()
            return

    def post_get_by_id(self):
        # domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id')

        session = self.session('repo')

        resp = None
        try:
            q = session.query(RepoUser).filter(RepoUser.user_id == user_id)
            user = q.one_or_none()

            if user:
                resp = {
                    'status': 'ok', 'data': {
                        'id': user.user_id,
                        'domain_id': user.domain_id,
                        'name': user.name,
                        'master_id': user.master_id,
                        'shard_id': user.shard_id,
                        'type': user.type,
                        'password': user.password,
                        'secret': user.secret,
                        'iv': user.iv,
                        'back_url': user.back_url,
                        'prefix': user.prefix,
                        'status': user.status,
                        'cooperation': user.cooperation,
                        'qq': user.qq,
                        'mobile': user.mobile,
                        'notes': user.notes,
                        'services': user.services,
                        'tsp_n': str(user.create_time),
                        # 'plevel_n': level_map.get(user.level),
                        'status_n': STATUS.get(user.status),

                        'account_name': user.account_name,
                        'account_number': user.account_number,
                        'account_bank': user.account_bank
                    }
                }
            else:
                resp = {'status': 'fail', 'msg': 'invalid user_id'}

        except Exception as e:
            request_log.exception('FAIL')
            resp = {'status': 'fail', 'msg': str(e)}

        finally:
            session.close()

        self.finish(json.dumps(resp))

    def post_list_all_users(self):
        domain_id = self.json_args.get('domain_id')
        size = int(self.json_args.get('size'))
        page = int(self.json_args.get('page'))

        search = self.json_args.get('search')

        session = self.session('repo')

        result = list()
        try:
            level_map = get_user_level(session, domain_id)

            q = session.query(RepoUser).filter(RepoUser.domain_id == domain_id).order_by(RepoUser.user_id)

            if search and len(search) > 0:
                q = q.filter(or_(RepoUser.tags.like("%" + search + "%"), RepoUser.user_id.like("%" + search + "%")))

            count = q.count()

            max_page = int(math.ceil(count / size))

            q = q.order_by(desc(RepoUser.id)).offset((page - 1) * size).limit(size)

            for user in q.all():
                result.append({
                    'id': user.user_id,
                    'domain_id': user.domain_id,
                    'name': user.name,
                    'master_id': user.master_id,
                    'shard_id': user.shard_id,
                    'type': user.type,
                    'password': user.password,
                    'secret': user.secret,
                    'iv': user.iv,
                    'back_url': user.back_url,
                    'prefix': user.prefix,
                    'status': user.status,
                    'cooperation': user.cooperation,
                    'qq': user.qq,
                    'mobile': user.mobile,
                    'notes': user.notes,
                    'services': user.services,
                    'tsp_n': str(user.create_time),
                    'plevel_n': level_map.get(user.level),
                    'status_n': STATUS.get(user.status),
                })

        finally:
            session.close()

        return self.write(json.dumps({
            'list': result,
            'max': max_page,
            'page': page,
            'size': size
        }))

    @tornado.gen.coroutine
    def post_add_user(self):
        domain_id = self.json_args.get('domain_id')
        template_id = self.json_args.get('template_id')
        user_name = self.json_args.get('name')
        # request_id = self.json_args.get('request_id')
        login = self.json_args.get('login')
        level = self.json_args.get('plevel', '1')
        notes = self.json_args.get('notes', '')
        qq = self.json_args.get('qq', '')
        mobile = self.json_args.get('mobile', '')

        session = self.session('repo')

        try:
            if len(user_name) < 2 or len(user_name) > MAX_NAME:
                raise ValueError('代理商名称长度不符合要求(2-%d字符) (%s)' % (MAX_NAME, user_name))

            if not login_re.match(login):
                raise ValueError('登录名不符合规则：小写字母或数字长度4~12位')

            exist_user = session.query(RepoUser).filter(RepoUser.domain_id == domain_id).filter(
                RepoUser.name == user_name).first()
            if exist_user:
                raise ValueError('代理商用户名已经存在 (%s)' % user_name)

            exist_operator = session.query(RepoOperator).filter(RepoOperator.domain_id == domain_id).filter(
                RepoOperator.login == login).first()
            if exist_operator:
                raise ValueError('代理商登录名已经存在 (%s)' % login)

            q = session.query(RepoTemplate).filter(RepoTemplate.domain_id == domain_id).filter(
                RepoTemplate.template_id == template_id)

            user_template = q.one()
            if user_template is None:
                raise ValueError('代理商模板异常')

            # Next UserID
            latest_user = session.query(RepoUser).filter(RepoUser.user_id >= user_template.user_id_start).filter(
                RepoUser.user_id <= user_template.user_id_end).order_by(desc(RepoUser.user_id)).first()

            if latest_user:
                if latest_user == user_template.user_id_end:
                    raise ValueError('用户数已超出限额，请联系开发人员！')

                user_id = str(int(latest_user.user_id) + 1)
            else:
                user_id = user_template.user_id_start

            user = RepoUser()
            user.user_id = user_id
            user.domain_id = domain_id
            user.name = user_name
            user.master_id = user_template.master_id or user_id
            user.shard_id = user_template.shard_id or user_id
            user.type = user_template.type
            user.password = gen_key(16, string.ascii_uppercase + string.ascii_lowercase + string.digits)
            user.secret = gen_key(32, string.ascii_uppercase + string.ascii_lowercase + string.digits)
            user.iv = gen_key(16, string.digits)
            user.back_url = user_template.back_url
            user.tags = get_initial(user_name)
            user.level = level
            user.prefix = user_template.prefix
            user.status = user_template.status
            user.create_time = dt.now()
            user.qq = qq
            user.mobile = mobile
            user.notes = notes
            user.services = user_template.services

            session.add(user)

            rand_pass = ''.join(random.sample(string.ascii_letters + string.digits, 6))
            signed = sign_request(rand_pass.encode())

            operator = RepoOperator()
            operator.domain_id = domain_id
            operator.user_id = user_id
            operator.login = login
            operator.name = user_name
            operator.password = signed
            operator.role = user_template.role
            operator.status = user_template.status
            session.add(operator)

            session.commit()
            self.finish({'status': 'ok', 'msg': 'OK', 'password': rand_pass})

            # sync user
            yield core.sync_user(session, domain_id)
            # sync pricing
            # yield core.sync_pricing(session, domain_id, filter_user=user_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                  domain_id=domain_id, product_id='', user_id=user_id))

        except ValueError as ve:
            self.finish({'status': 'fail', 'msg': str(ve)})

        except Exception as ee:
            request_log.exception('ADD USER')
            self.finish({'status': 'fail', 'msg': 'EXCEPTION'})

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_add_operator(self):
        domain_id = self.json_args.get('domain_id')
        login = self.json_args.get('login')
        user_id = self.json_args.get('user_id')
        name = self.json_args.get('name')
        role = self.json_args.get('role')

        session = self.session('repo')

        try:
            if len(name) < 2 or len(name) > MAX_NAME:
                raise ValueError('名称长度不符合要求(2-%d字符) (%s)' % (MAX_NAME, name))

            if not login_re.match(login):
                raise ValueError('登录名不符合规则：小写字母或数字长度4~12位')

            exist_user = session.query(RepoUser).filter(RepoUser.domain_id == domain_id).filter(
                RepoUser.user_id == user_id).first()
            if exist_user is None:
                raise ValueError('代理商不存在 (%s)' % user_id)

            exist_operator = session.query(RepoOperator).filter(RepoOperator.domain_id == domain_id).filter(
                RepoOperator.login == login).first()
            if exist_operator:
                raise ValueError('代理商登录名已经存在 (%s)' % login)

            rand_pass = ''.join(random.sample(string.ascii_letters + string.digits, 6))
            signed = sign_request(rand_pass.encode())

            operator = RepoOperator()
            operator.domain_id = domain_id
            operator.user_id = user_id
            operator.login = login
            operator.name = name
            operator.password = signed
            operator.role = role
            operator.status = 'enabled'
            session.add(operator)

            session.commit()
            self.finish({'status': 'ok', 'msg': '创建成功', 'password': rand_pass})

            # sync user
            yield core.sync_user(session, domain_id)

        except ValueError as ve:
            self.finish({'status': 'fail', 'msg': str(ve)})

        except Exception as ee:
            request_log.exception('ADD USER')
            self.finish({'status': 'fail', 'msg': 'EXCEPTION'})

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_update_user(self):
        domain_id = self.json_args.get('domain_id')

        user_id = self.json_args.get('id')
        user_name = self.json_args.get('name')
        master_id = self.json_args.get('master_id')
        back_url = self.json_args.get('back_url')
        level = self.json_args.get('plevel')
        status = self.json_args.get('status')

        session = self.session('repo')

        try:
            # load & update
            user = session.query(RepoUser).filter(RepoUser.domain_id == domain_id).filter(
                RepoUser.user_id == user_id).first()

            if user is None:
                raise ValueError('代理商不存在')

            if user_name and user_name != user.name:
                if len(user_name) < 2 or len(user_name) > MAX_NAME:
                    raise ValueError('代理商名称长度不符合要求(2-%d字符) (%s)' % (MAX_NAME, user_name))

                exist_user = session.query(RepoUser).filter(RepoUser.domain_id == domain_id).filter(
                    RepoUser.name == user_name).first()

                if exist_user:
                    raise ValueError('代理商用户名已经存在 (%s)' % user_name)
                user.name = user_name
                user.tags = get_initial(user_name)

            if back_url and user.back_url != back_url:
                user.back_url = back_url

            if master_id and user.master_id != master_id:
                user.master_id = master_id

            if level and user.level != level:
                user.level = level

            if status and user.status != status:
                user.status = status

            session.add(user)
            session.commit()

            self.finish({'status': 'ok', 'msg': 'OK'})

            # sync user
            yield core.sync_user(session, domain_id)
            # sync pricing
            # yield core.sync_pricing(session, domain_id, filter_user=user_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                  domain_id=domain_id, product_id='', user_id=user_id))

        except ValueError as ve:
            self.finish({'status': 'fail', 'msg': str(ve)})

        except Exception as ee:
            request_log.exception('UPDATE USER')
            self.finish({'status': 'fail', 'msg': 'EXCEPTION'})

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_sync(self):
        domain_id = self.json_args.get('domain_id')

        self.finish({'status': 'ok', 'msg': 'OK'})

        session = self.session('repo')

        try:
            yield core.sync_user(session, domain_id)

        finally:
            session.close()
