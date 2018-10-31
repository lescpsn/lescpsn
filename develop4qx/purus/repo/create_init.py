import os
from sqlalchemy import create_engine, Integer, Column, String
from sqlalchemy.orm import sessionmaker
import yaml
from sqlalchemy.ext.declarative import declarative_base
import sys
import shutil
from repo import ConfigRepo

Base = declarative_base()


class Role(Base):
    __tablename__ = 'role'

    id = Column(Integer, primary_key=True)
    role_set = Column(String)
    role = Column(String)


class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    display_name = Column(String)
    avatar = Column(String)
    partner_id = Column(String)
    password = Column(String(100))
    role = Column(String(50))
    status = Column(String(20))

    def __repr__(self):
        return "<User(name='%s', role='%s')>" % (self.name, self.role)


"""
1 load config
2 check meta & template
3 check init
4 import downstream
5 create base
6 publish
7 init commit
"""

REPO_DIR = 'config_repo'
#URL = 'mysql+mysqlconnector://purus:Purus_123@pugqzxmy.mysql.rds.aliyuncs.com:3998/purus'

DOWNSTREAM = []
USER = []
USER_PASSWORD = {}


def dump_db(repo):
    engine = create_engine(URL, pool_size=1, echo=False, echo_pool=False, pool_recycle=3600)

    session = sessionmaker(bind=engine)()

    try:
        q = session.query(User).order_by(User.id)
        for user in q.all():

            ds = repo.get_downstream(user.partner_id)
            if ds is None:
                print('INVALID USER %s' % user.partner_id, file=sys.stderr)
                continue

            u = {
                'id': user.id,
                'login': user.name,
                'name': user.display_name,
                'password': user.password,
                'role': user.role,
                'user_id': user.partner_id,
                'status': user.status
            }
            repo.add_user(u, 'default')

            USER_PASSWORD[str(user.id)] = user.password

        q = session.query(Role).order_by(Role.id)
        for r in q.all():
            repo.add_role(r.role_set, r.role)

        repo.save('role')
    except Exception as e:
        print(e)
    finally:
        session.close()

        yaml.dump(USER_PASSWORD, open('../password.yaml', 'w'))


def loading_ui(path, ui_name):
    print('LOADING CORE %s' % path)
    # import ui
    cfg = yaml.load(open(REPO_DIR + '/init/' + path, 'r', encoding='utf8'))
    for key in sorted(cfg.get('downstream')):
        downstream = cfg.get('downstream').get(key)

        d = dict({'id': None,
                  'name': None,
                  'master_id': None,
                  'shard_id': None,
                  'sharding': '42.121.252.237',
                  'type': 'data-seller',
                  'ui': ui_name,
                  'pass': None,
                  'iv': None,
                  'back_url': None})

        d['id'] = key
        d['name'] = downstream.get('name')

        d['master_id'] = downstream.get('master') or key
        d['shard_id'] = downstream.get('shard_id') or d['master_id']

        if 'iv' in downstream and 'pass' in downstream:
            d['iv'] = downstream.get('iv')
            d['pass'] = downstream.get('pass')
        else:
            d['type'] = 'data-agent'

        d['sharding'] = downstream.get('shard')

        if d['sharding'] == '42.121.254.121:8899':
            d['type'] = 'fee-agent'

        # print('ADDING DOWNSTREAM \n%s\n%s\n' % (repr(downstream), repr(d)))
        DOWNSTREAM.append(d)


def loading_core(path, core_name):
    print('LOADING CORE %s' % path)
    # import core
    cfg = yaml.load(open(REPO_DIR + '/init/' + path, 'r', encoding='utf8'))

    for key in sorted(cfg.get('downstream')):
        downstream = cfg.get('downstream').get(key)

        try:
            d2 = next(d for d in DOWNSTREAM if d['id'] == key)
        except StopIteration:
            print('CORE USER NOT IN UI %s' % key, file=sys.stderr)
            continue

        d2['core'] = core_name

        if 'key' in downstream:
            d2['key'] = downstream.get('key')

        if 'back_url' in downstream:
            d2['back_url'] = downstream.get('back_url')

        if 'content' in downstream:
            d2['content'] = downstream.get('content')

        if 'iv' in downstream and 'pass' in downstream:
            d2['iv'] = downstream.get('iv')
            d2['pass'] = downstream.get('pass')


def copy_base(cfg_file, base_file):
    print('CREATE %s FROM /init/%s' % (base_file, cfg_file))

    src = open(REPO_DIR + '/init/' + cfg_file, 'r', encoding='utf8')
    desc = open(REPO_DIR + '/' + base_file, 'w', encoding='utf8')

    in_downstream = False

    for line in src:
        if line.startswith('downstream:'):
            in_downstream = True
            continue

        if in_downstream and (line.startswith('  ') or line == '\n'):
            continue

        in_downstream = False
        desc.write(line)

    src.close()
    desc.close()


def init():
    # 1
    file_to_commit = ['meta.yaml', 'role.yaml', 'template.yaml', 'user.yaml', 'downstream.yaml']

    meta = yaml.load(open(REPO_DIR + '/meta.yaml', 'r', encoding='utf-8'))
    sites = meta.get('sites')

    purus_sites = [k for k in sites if sites[k]['publisher'] == 'purus']
    madeira_sites = [k for k in sites if sites[k]['publisher'] == 'madeira']

    for site_id in purus_sites:
        site = sites[site_id]
        # make base
        base = site.get('base')
        cfg = site.get('filename')

        copy_base(cfg, base)
        loading_ui(cfg, site_id)

        file_to_commit.append(base)
        file_to_commit.append(cfg)

    for site_id in madeira_sites:
        site = sites[site_id]
        # make base
        base = site.get('base')
        cfg = site.get('filename')

        copy_base(cfg, base)
        loading_core(cfg, site_id)

        file_to_commit.append(base)
        file_to_commit.append(cfg)

    # clean
    if os.path.exists(REPO_DIR + '/.git'):
        shutil.rmtree(REPO_DIR + '/.git')

    if os.path.exists(REPO_DIR + '/downstream.yaml'):
        os.remove(REPO_DIR + '/downstream.yaml')

    if os.path.exists(REPO_DIR + '/user.yaml'):
        os.remove(REPO_DIR + '/user.yaml')

    # if os.path.exists(REPO_DIR + '/role.yaml'):
    #     os.remove(REPO_DIR + '/role.yaml')

    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in DOWNSTREAM:
        repo.add_downstream(d, d['type'])

    dump_db(repo)

    repo.publish()

    repo.commit_all(file_to_commit, True)


def init_publish():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)
    repo.publish()


def init_publish_price():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)
    repo.publish_pricing()


if __name__ == '__main__':
    # init_publish()
    init_publish_price()
