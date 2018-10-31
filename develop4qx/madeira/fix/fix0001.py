import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_order_shard, get_trans_shard

debug = False

FIX_USER = '200801'
FIX_BEGIN = datetime.datetime(2014, 10, 11)
FIX_END = datetime.datetime(2014, 10, 12)


def do_fix():
    config = yaml.load(open('../config.yaml', 'r'))

    engine = create_engine(
        config['database']['url'],
        pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

    session_maker = sessionmaker(bind=engine)

    try:
        session = session_maker()

        order_cls = get_order_shard(FIX_USER)
        trans_cls = get_trans_shard(FIX_USER)

        # Fix trans
        orders = session.query(order_cls).filter(order_cls.req_time >= FIX_BEGIN).filter(
            order_cls.req_time < FIX_END).order_by(order_cls.req_time)

        i = 0
        for order in orders.all():

            # DEBIT
            if order.result == '0':
                trans = session.query(trans_cls).filter(trans_cls.order_id == order.order_id).filter(
                    trans_cls.type == 'debit').first()

                if trans is None:
                    tsp = order.req_time.strftime('%Y%m%d%H%M%S')
                    fix_trans = trans_cls(trans_id='F%s%08d' % (tsp, i),
                                          type='debit',
                                          income=0,
                                          outcome=order.value,
                                          balance=0,
                                          order_id=order.order_id,
                                          user_id=FIX_USER,
                                          account=order.mobile,
                                          create_time=order.req_time)

                    i += 1
                    session.add(fix_trans)
                    session.commit()

                    print('Fix DEBIT %s' % fix_trans)

            # REFUND
            if order.back_result == '9':
                trans = session.query(trans_cls).filter(trans_cls.order_id == order.order_id).filter(
                    trans_cls.type == 'refund').first()

                if trans is None:
                    tsp = order.req_time.strftime('%Y%m%d%H%M%S')
                    fix_trans = trans_cls(trans_id='F%s%08d' % (tsp, i),
                                          type='refund',
                                          income=order.value,
                                          outcome=0,
                                          balance=0,
                                          order_id=order.order_id,
                                          user_id=FIX_USER,
                                          account=order.mobile,
                                          create_time=order.req_time)

                    i += 1
                    session.add(fix_trans)
                    session.commit()

                    print('Fix REFUND %s' % fix_trans)

        # Fix balance (Generic)
        all_trans = session.query(trans_cls).order_by(trans_cls.create_time, trans_cls.trans_id)

        balance = 0
        i = 0
        for trans in all_trans:
            balance = balance + trans.income - trans.outcome

            if balance != trans.balance:
                print('Update trans trans_id=%s, time=%s' % (trans.trans_id, trans.create_time))

                trans.balance = balance
                session.add(trans)
                i += 1
                if i % 100 == 0:
                    session.commit()

        session.commit()
    finally:
        session.close()


if __name__ == "__main__":
    do_fix()