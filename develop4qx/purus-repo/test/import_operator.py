from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml
from db.repo import RepoUser, RepoProduct, RepoSpecial, RepoOperator
from datetime import datetime as dt

engine = create_engine(
    'mysql+mysqlconnector://repo:Repo_123@192.168.137.8:3306/repo',
    pool_size=2,
    echo=True,
    echo_pool=True,
    pool_recycle=3600)

session = sessionmaker(bind=engine)()


def do_import():
    try:
        d = yaml.load(open('user.yaml', 'r', encoding='utf8'))

        for op in d['user']:
            print(op)

            operator = RepoOperator()
            operator.id = op.get('id')
            operator.domain_id = '000000'
            operator.login = op.get('login')
            operator.name = op.get('name')
            operator.password = op.get('password')
            operator.role = op.get('role')
            operator.user_id = op.get('user_id')
            operator.status = 'enabled'

            session.add(operator)
            session.commit()

    finally:
        session.close()


do_import()
