import datetime as dt

from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_order_shard, get_trans_shard, get_up_order_shard
from utils.phone import MobileClassifier

debug = True

FIX_USER = '700102'

'''
fix product
'''


def do_fix():
    config = yaml.load(open('../config.yaml', 'r'))

    engine = create_engine(
        config['database']['url'],
        pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

    session_maker = sessionmaker(bind=engine)

    try:
        session = session_maker()

        classifier = MobileClassifier()

        order_cls = get_order_shard(FIX_USER)
        trans_cls = get_trans_shard(FIX_USER)

        # Start from batch_order
        orders = session.query(order_cls).filter(order_cls.area.is_(None)).order_by(
            order_cls.mobile).limit(500)

        i = 1

        cache = {'header': None, 'area': None}
        for order in orders.all():

            if order.mobile[0:7] == cache['header']:
                order.area = cache['area']
            else:
                head = order.mobile[0:7]
                o, a = classifier.search(int(head))

                if o and a:
                    cache['header'] = head
                    cache['area'] = '%d:%s' % (o, a)
                    order.area = cache['area']
                else:
                    print('INVALID HEADER %s' % head)
                    continue

            session.add(order)
            i += 1

            all_trans = session.query(trans_cls).filter(trans_cls.order_id == order.order_id)
            for trans in all_trans.all():
                trans.name = '{prod}:{area}:{price}'.format(prod=order.product, area=order.area, price=order.price)
                session.add(trans)

            if i % 100 == 0:
                session.commit()

        session.commit()
    finally:
        session.close()


if __name__ == "__main__":
    do_fix()