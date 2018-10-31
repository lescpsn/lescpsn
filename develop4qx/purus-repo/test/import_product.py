from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml
from db.repo import RepoProduct
from datetime import datetime as dt

engine = create_engine(
    'mysql+mysqlconnector://repo:Repo_123@192.168.137.8:3306/repo',
    pool_size=2,
    echo=True,
    echo_pool=True,
    pool_recycle=3600)

session = sessionmaker(bind=engine)()

try:
    p = yaml.load(open('product.yaml', 'r', encoding='utf8'))

    for product in p['product']:
        print(product)

        p = RepoProduct()

        p.domain_id = '000000'
        p.product_id = product.get('id')
        p.name = product.get('name')
        p.type = product.get('type')
        p.carrier = product.get('carrier')
        p.price = product.get('price')
        p.value = product.get('value')
        p.area = product.get('area')
        p.use_area = product.get('use_area')
        p.p1 = product.get('p1')
        p.p2 = product.get('p2')
        p.p3 = product.get('p3')
        p.p4 = product.get('p4')
        p.p5 = product.get('p5')
        p.scope = product.get('scope')
        p.legacy_id = product.get('legacy')
        p.routing = product.get('routing')
        p.notes = product.get('notes')
        p.status = product.get('status')
        p.update_time = dt.now()

        session.add(p)
        session.commit()

finally:
    session.close()
