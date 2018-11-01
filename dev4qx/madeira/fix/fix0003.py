import datetime as dt

from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_order_shard, get_trans_shard, get_up_order_shard

debug = False

FIX_USER = '700102'

'''
fix order/up_order/transaction
'''
Base = declarative_base()


class JagBatchOrder(Base):
    __tablename__ = 'jag_batch_order'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    batch_id = Column(String)
    number = Column(String)
    value = Column(Integer)
    face_value = Column(Integer)
    offer_id = Column(String)
    request = Column(String)
    status = Column(String)
    result = Column(String)
    create_time = Column(DateTime)
    update_time = Column(DateTime)


class JagCtOrder(Base):
    __tablename__ = 'jag_ct_order'

    request_no = Column(String, primary_key=True)
    status = Column(String)
    result = Column(String)
    create_time = Column(DateTime)
    update_time = Column(DateTime)
    callback_time = Column(DateTime)


def do_fix():
    config = yaml.load(open('../config.yaml', 'r'))

    engine_jaguar = create_engine(
        'mysql+mysqlconnector://madeira:madeira_123@192.168.137.1/jaguar',
        pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

    engine_madeira = create_engine(
        config['database']['url'],
        pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

    session_maker_jaguar = sessionmaker(bind=engine_jaguar)
    session_maker_madeira = sessionmaker(bind=engine_madeira)

    try:
        session_jaguar = session_maker_jaguar()
        session_madeira = session_maker_madeira()

        up_order_cls = get_up_order_shard(FIX_USER)
        order_cls = get_order_shard(FIX_USER)
        trans_cls = get_trans_shard(FIX_USER)

        # Start from batch_order
        jag_batch_orders = session_jaguar.query(JagBatchOrder).filter(JagBatchOrder.user_id == 'tb711').order_by(
            JagBatchOrder.create_time)

        i = 1
        t = 1
        for jag_batch_order in jag_batch_orders.all():

            jag_ct_order = session_jaguar.query(JagCtOrder).filter(
                JagCtOrder.request_no == jag_batch_order.request).first()

            if jag_ct_order:
                resp_time = jag_ct_order.update_time
                back_time = jag_ct_order.callback_time
                result = '00000'
                back_result = jag_ct_order.result
            else:
                resp_time = jag_batch_order.update_time
                back_time = None
                result = jag_batch_order.result
                back_result = None

            # Q2014103014243610000013
            # P2014103014243600000018
            # F2014110111074200000015
            # Create order
            tsp = jag_batch_order.create_time.strftime('%Y%m%d%H%M%S')
            order_id = 'Q%s1%07d' % (tsp, i)
            sp_order_id = 'P%s%08d' % (tsp, i)
            price = int(int(jag_batch_order.face_value) / 1000)
            cost = price * 9600
            value = price * 9700
            i += 1

            order = order_cls(
                order_id=order_id,
                user_id=FIX_USER,
                price=price,
                mobile=jag_batch_order.number,
                sp_order_id=sp_order_id,
                req_time=jag_batch_order.create_time,
                resp_time=resp_time,
                back_time=back_time,
                result=result,
                value=value,
                back_result=back_result,
                product='data')

            session_madeira.add(order)

            # Create up_order if exist
            if jag_ct_order:
                up_order = up_order_cls(
                    stage=1,
                    order_id=order_id,
                    up_order_id=order_id,
                    route='21cn',
                    price=price,
                    cost=cost,
                    up_cost=cost,
                    up_req_time=jag_batch_order.create_time,
                    up_resp_time=resp_time,
                    up_back_time=back_time,
                    up_result=int(result),
                    up_back_result=back_result)

                session_madeira.add(up_order)

            # Create transaction
            if result == '00000':
                trans = trans_cls(
                    trans_id='F%s%08d' % (tsp, t),
                    type='debit',
                    income=0,
                    outcome=value,
                    balance=0,
                    order_id=order_id,
                    user_id=FIX_USER,
                    account=jag_batch_order.number,
                    create_time=jag_batch_order.create_time)
                t += 1

                session_madeira.add(trans)

            if back_result and back_result != '00000':
                trans = trans_cls(
                    trans_id='F%s%08d' % (tsp, t),
                    type='refund',
                    income=value,
                    outcome=0,
                    balance=0,
                    order_id=order_id,
                    user_id=FIX_USER,
                    account=jag_batch_order.number,
                    create_time=back_time)
                t += 1

                session_madeira.add(trans)

            session_madeira.commit()

    finally:
        session_jaguar.close()
        session_madeira.close()


if __name__ == "__main__":
    do_fix()