import datetime as dt

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_order_shard, get_trans_shard, get_up_order_shard

debug = False

FIX_USER = '200801'

FIX_RECORD = r'''
2014-10-12 09:45:18,XS140930950715,Q2014093011450600029757,49.2
2014-10-12 09:45:58,XS141011072932,Q2014101112373200043466,49.2
2014-10-12 09:46:41,XS141011049480,Q2014101107444400043399,98.4
2014-10-12 09:47:22,XS141009970132,Q2014100922175400043323,49.2
2014-10-12 09:54:36,XS140930960719,Q2014093013052400030297,98.4
2014-10-12 09:54:50,XS140930955164,Q2014093012220700030006,98.4
2014-10-12 15:42:40,XS141011108754,Q2014101121121800043536,98.4
2014-10-12 15:43:24,XS140930029030,Q2014093021424300034179,98.4
2014-10-13 09:20:44,XS140917000510,Q2014091711065400012764,49.2
2014-10-13 13:01:02,XS141011106769,Q2014101120473900043535,49.2
2014-10-13 13:01:32,XS140930939536,Q2014093010222700029139,49.2
2014-10-14 13:01:42,XS141002407892,Q2014100219091800038025,49.2
2014-10-14 18:34:11,XS141011072147,Q2014101112274100043461,49.2
2014-10-16 19:03:19,XS140930021724,Q2014093020520600033829,98.4
2014-10-18 11:44:08,XS140930956491,Q2014093012314200030086,29.52
2014-10-19 17:02:32,XS141004605857,Q2014100417335200041399,98.4
'''


def do_fix():
    config = yaml.load(open('../config.yaml', 'r'))

    engine = create_engine(
        config['database']['url'],
        pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

    session_maker = sessionmaker(bind=engine)

    try:
        session = session_maker()

        up_order_cls = get_up_order_shard(FIX_USER)
        order_cls = get_order_shard(FIX_USER)
        trans_cls = get_trans_shard(FIX_USER)

        i = 1
        for line in FIX_RECORD.split('\n'):
            if len(line) < 10:
                continue

            print(line)

            tsp = dt.datetime.strptime(line[0:19], '%Y-%m-%d %H:%M:%S')

            sp_order_id = line[20:34]
            order_id = line[35:58]
            cost = line[59:]

            up_order = session.query(up_order_cls).filter(up_order_cls.up_order_id == sp_order_id).first()

            # Verify UpOrder
            if up_order:
                if up_order.order_id != order_id:
                    print("INVALID " + sp_order_id)
                    break

                if up_order.up_cost != cost:
                    print("INVALID " + sp_order_id)
                    break

            order = session.query(order_cls).filter(order_cls.order_id == order_id).first()

            if order is None:
                print("INVALID " + order_id)
                break

            print('price=%d, cost=%s' % (order.value, cost))

            t = tsp.strftime('%Y%m%d%H%M%S')

            fix_trans = trans_cls(trans_id='F%s%08d' % (t, i),
                                  type='refund-manual',
                                  income=order.value,
                                  outcome=0,
                                  balance=0,
                                  order_id=order.order_id,
                                  user_id=FIX_USER,
                                  account=order.mobile,
                                  create_time=tsp)

            i += 1
            session.add(fix_trans)
            session.commit()

    finally:
        session.close()


if __name__ == "__main__":
    do_fix()