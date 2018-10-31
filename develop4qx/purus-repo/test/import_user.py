from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml
from db.repo import RepoUser, RepoProduct, RepoSpecial
from datetime import datetime as dt

engine = create_engine(
    'mysql+mysqlconnector://repo:Repo_123@192.168.137.8:3306/repo',
    pool_size=2,
    echo=True,
    echo_pool=True,
    pool_recycle=3600)

session = sessionmaker(bind=engine)()


def filter_none(value):
    if value == 'None':
        return None
    else:
        return value


def do_import():
    try:
        d = yaml.load(open('downstream.yaml', 'r', encoding='utf8'))

        for downstream in d['downstream']:
            print(downstream)

            user = RepoUser()
            user.user_id = downstream.get('id')
            user.domain_id = '000000'
            user.name = downstream.get('name')
            user.master_id = downstream.get('master_id')
            user.shard_id = downstream.get('shard_id')
            user.type = downstream.get('type')

            user.password = filter_none(downstream.get('pass'))
            user.secret = filter_none(downstream.get('key'))
            user.iv = filter_none(downstream.get('iv'))
            user.back_url = filter_none(downstream.get('back_url'))

            user.tags = filter_none(downstream.get('tags'))
            user.level = downstream.get('plevel')
            user.prefix = downstream.get('prefix')
            user.status = downstream.get('status')
            user.create_time = dt.fromtimestamp(downstream.get('tsp', 0))
            user.update_time = user.create_time
            user.cooperation = downstream.get('cooperation')
            user.qq = downstream.get('qq')
            user.mobile = downstream.get('mobile')
            user.notes = downstream.get('notes')
            user.services = downstream.get('ui') + ',' + downstream.get('core')

            if downstream.get('content'):
                user.details = 'content=true'

            session.add(user)
            session.commit()

    finally:
        session.close()


do_import()
