from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.repo import *

URL = 'mysql+mysqlconnector://repo:Repo_123@192.168.137.8:3306/repo'

engine = create_engine(URL, pool_size=1, echo=True, echo_pool=True, pool_recycle=3600)
session_maker = sessionmaker(bind=engine)


def clean_domain(domain_id):
    session = session_maker()

    try:
        session.query(RepoDomain).filter(RepoDomain.domain_id == domain_id).delete()

        session.query(RepoInterfacePrice).filter(RepoInterfacePrice.domain_id == domain_id).delete()

        session.query(RepoOperator).filter(RepoOperator.domain_id == domain_id).delete()

        session.query(RepoRouteInterface).filter(RepoRouteInterface.domain_id == domain_id).delete()

        session.query(RepoRouteSupply).filter(RepoRouteSupply.domain_id == domain_id).delete()

        session.query(RepoTemplate).filter(RepoTemplate.domain_id == domain_id).delete()

        session.query(RepoUser).filter(RepoUser.domain_id == domain_id).delete()

        session.commit()

    finally:
        session.close()


if __name__ == "__main__":
    clean_domain('000003')
    clean_domain('000004')
