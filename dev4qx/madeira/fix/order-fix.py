from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
import yaml
from utils.phone import MobileClassifier

try:
    from db.model import Order
except:
    from model import Order

m = MobileClassifier()


def fix_order_area():
    """
    """
    try:
        session = Session()

        q = session.query(Order).filter(Order.area == None).order_by(Order.req_time).all()

        i = 0
        for order in q:
            if len(order.mobile) != 11:
                continue

            # print(book.value)
            head = int(order.mobile[0:7])
            # print(head)
            print('1')
            o, a = m.search(head)
            print('2')
            if o:
                # print(o, a)
                order.area = '%s:%s' % (o, a)
                # session.add(order)

            i += 1
            if i % 100 == 0:
                session.commit()
    finally:
        session.close()


if __name__ == "__main__":
    config = yaml.load(open('../config.yaml', 'r'))

    url = config['database']['url']

    engine = create_engine(url, pool_size=2,
                           echo=True,
                           echo_pool=True, pool_recycle=3600)

    Session = sessionmaker(bind=engine)

    fix_order_area()