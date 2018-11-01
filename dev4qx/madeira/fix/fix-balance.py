import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_order_shard, get_trans_shard

debug = False

FIX_USER = '200801'


def do_fix():
    config = yaml.load(open('../config.yaml', 'r'))

    engine = create_engine(
        config['database']['url'],
        pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

    session_maker = sessionmaker(bind=engine)

    try:
        session = session_maker()

        trans_cls = get_trans_shard(FIX_USER)

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