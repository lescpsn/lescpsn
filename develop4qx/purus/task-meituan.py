from datetime import datetime
import logging
import logging.config
import os
import time

from redis.sentinel import Sentinel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.meituan import MeituanOrder


task_log = logging.getLogger("madeira.task")


def load_config():
    with open('config.yaml', 'r') as stream:
        return yaml.load(stream)


MASTER_MAPPING = {}
MASTER_TIME = -1


def load_mapping(force=False):
    global MASTER_TIME

    t = int(os.path.getmtime('config.yaml'))
    if not force and t == MASTER_TIME:
        return

    stream = open('config.yaml', 'r')
    config = yaml.load(stream)
    stream.close()
    task_log.info('LOADING CONFIG %d=>%d', t, MASTER_TIME)
    MASTER_TIME = t

    for user_id in config['downstream']:
        if 'shard' in config['downstream'][user_id]:
            master_id = config['downstream'][user_id]['shard']
            task_log.info('%s -> %s (SHARD)' % (user_id, master_id))
            MASTER_MAPPING[user_id] = master_id
        elif 'master' in config['downstream'][user_id]:
            master_id = config['downstream'][user_id]['master']
            task_log.info('%s -> %s (MASTER)' % (user_id, master_id))
            MASTER_MAPPING[user_id] = master_id
        else:
            MASTER_MAPPING[user_id] = user_id

    return config


class TransTask():
    def __init__(self):

        core_cfg = load_mapping(True)

        sentinels = [(c['ip'], c['port']) for c in core_cfg['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=0, decode_responses=True)

        engine = create_engine(
            core_cfg['database']['url'],
            pool_size=2, echo=True, echo_pool=True, pool_recycle=3600)

        self.session = sessionmaker(bind=engine)


    def persist_single(self, meituan_order_id, session, master):
        task_log.info('SAVING %s', meituan_order_id)

        try:
            quxun_order_id,\
            mobile,\
            product_id,\
            order_state,\
            meituan_sn,\
            notes,\
            create_tsp,\
            check_tsp,\
            finish_tsp\
                = master.hmget("meituan:{0}".format(meituan_order_id),
                                            "quxun_order_id",
                                            "mobile",
                                            "product_id",
                                            "order_state",
                                            "meituan_sn",
                                            "notes",
                                            "create_tsp",
                                            "check_tsp",
                                            "finish_tsp")
            meituan_order = MeituanOrder()
            meituan_order.meituan_order_id = meituan_order_id
            meituan_order.quxun_order_id = quxun_order_id
            meituan_order.mobile = mobile
            meituan_order.product_id = product_id
            meituan_order.order_state = order_state
            meituan_order.meituan_sn = meituan_sn
            meituan_order.notes = notes
            meituan_order.create_date= None
            if create_tsp:
                meituan_order.create_date= datetime.fromtimestamp(int(create_tsp))
            meituan_order.check_date= None
            if check_tsp:
                meituan_order.check_date= datetime.fromtimestamp(int(check_tsp))
            meituan_order.finish_date= None
            if finish_tsp:
                meituan_order.finish_date= datetime.fromtimestamp(int(finish_tsp))
            session.add(meituan_order)
            session.commit()

            return 0

        except Exception as e:
            task_log.exception("persist_single")
            return -1


    def persist(self):
        load_mapping()

        # task_log.debug('persist')
        master = self.sentinel.master_for('madeira')

        session = self.session()
        try:
            for x in range(40):
                meituan_order_id = master.spop('set:meituan:finish')

                if meituan_order_id is None:
                    break

                r = self.persist_single(meituan_order_id, session, master)
                if r == -1:
                    task_log.error("FAIL ON %s", meituan_order_id)
        except Exception as e:
            task_log.exception('persist')
        finally:
            session.close()


if __name__ == "__main__":

    cfg = yaml.load(open('logging-task-trans.yaml', 'r'))
    logging.config.dictConfig(cfg)

    task = TransTask()

    while True:
        task.persist()
        time.sleep(10)