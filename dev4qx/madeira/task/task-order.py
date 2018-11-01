from datetime import datetime
import logging
import logging.config
import time

from redis.sentinel import Sentinel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_up_order_shard, get_order_shard

task_log = logging.getLogger("madeira.task")


def get_s(obj, binary):
    if binary not in obj:
        return None
    return obj[binary]


def get_i(obj, binary):
    if binary not in obj:
        return None
    try:
        return int(obj[binary])
    except:
        return None


def get_t(obj, binary):
    if binary not in obj:
        return None
    try:
        t = float(obj[binary])
        return datetime.fromtimestamp(t)
    except:
        return None


MASTER_MAPPING = {}
MASTER_TIME = -1

MODE_UNFINISHED = 1
MODE_FINISHED = 2


def load_mapping(force=False):
    global MASTER_TIME

    t = int(os.path.getmtime('downstream.yaml'))
    if not force and t == MASTER_TIME:
        return

    stream = open('config.yaml', 'r', encoding='utf8')
    config = yaml.load(stream)
    stream.close()

    stream = open('downstream.yaml', 'r', encoding='utf8')
    config2 = yaml.load(stream)
    config['downstream'] = config2.get('downstream')

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


class OrderTask():
    def __init__(self):

        core_cfg = load_mapping(True)

        sentinels = [(c['ip'], c['port']) for c in core_cfg['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.5, db=1, decode_responses=True)

        engine = create_engine(
            core_cfg['database']['url'],
            pool_size=2, echo=True, echo_pool=True, pool_recycle=3600)

        self.session = sessionmaker(bind=engine)

    def persist_single(self, order_id, session, master, mode):
        task_log.info('PROCESS %s', order_id)

        try:
            order_key = 'order:%s' % order_id
            order_info = master.hgetall(order_key)

            key_id = get_i(order_info, 'id')

            user_id = get_s(order_info, 'user_id')

            if user_id not in MASTER_MAPPING:
                task_log.info("RELOAD CONFIG FOR %s", user_id)
                load_mapping(True)

            master_id = MASTER_MAPPING[user_id]

            order_cls = get_order_shard(master_id)

            order = None

            if key_id:
                order = session.query(order_cls).filter(order_cls.id == key_id).one()

            if order is None:
                order = order_cls()

            sp_order_id = get_s(order_info, 'sp_order_id')
            price = get_i(order_info, 'price')

            order.order_id = order_id
            order.user_id = user_id
            order.price = price
            order.mobile = get_s(order_info, 'mobile')
            order.sp_order_id = sp_order_id
            order.req_time = get_t(order_info, 'req_time')
            order.resp_time = get_t(order_info, 'resp_time')
            order.back_time = get_t(order_info, 'back_time')
            order.result = get_s(order_info, 'result') or 'None'
            order.back_result = get_s(order_info, 'back_result')
            order.value = get_i(order_info, 'value')
            order.balance = get_i(order_info, 'balance')
            order.area = get_s(order_info, 'area')
            order.product = get_s(order_info, 'product')
            order.scope = get_s(order_info, 'scope')
            if order.scope == 'None':
                order.scope = None

            session.add(order)
            session.commit()

            if mode == MODE_UNFINISHED:
                master.hset(order_key, 'id', order.id)  # set id

            # --------------UP--------------------
            stage = get_i(order_info, 'stage')

            if stage:
                for i in range(1, stage + 1):
                    up_req_time = get_t(order_info, 'up_req_time/%d' % i)

                    if up_req_time is None:
                        continue

                    up_order_cls = get_up_order_shard(master_id)

                    up_order = None
                    up_key_id = get_i(order_info, 'id/%d' % i)

                    if up_key_id:
                        up_order = session.query(up_order_cls).filter(up_order_cls.id == up_key_id).one()

                    if up_order is None:
                        up_order = up_order_cls()

                    up_order.stage = i
                    up_order.order_id = order_id
                    up_order.up_order_id = get_s(order_info, 'up_order_id/%d' % i)
                    up_order.route = get_s(order_info, 'route/%d' % i)
                    up_order.price = price
                    up_order.cost = get_i(order_info, 'cost/%d' % i)
                    up_order.up_cost = get_s(order_info, 'up_cost/%d' % i)
                    up_order.up_req_time = up_req_time
                    up_order.up_resp_time = get_t(order_info, 'up_resp_time/%d' % i)
                    up_order.up_back_time = get_t(order_info, 'up_back_time/%d' % i)
                    up_order.up_result = get_s(order_info, 'up_result/%d' % i)
                    up_order.up_back_result = get_s(order_info, 'up_back_result/%d' % i)

                    session.add(up_order)
                    session.commit()

                    if mode == MODE_UNFINISHED:
                        master.hset(order_key, 'id/%d' % i, up_order.id)  # set id

            if mode == MODE_FINISHED:
                master.expire(order_key, 8 * 3600)
                master.expire('map:%s:%s' % (user_id, sp_order_id), 24 * 3600)

            return 0

        except Exception as e:
            task_log.exception('PROCESS %s FAIL(MODE=%s)', order_id, mode)
            session.rollback()
            return -1

    def persist_all(self):

        load_mapping()

        task_log.debug('TASK ORDER START')
        master = self.sentinel.master_for('madeira')

        if master.exists('flag:task'):
            task_log.info('STOP FLAG FOUND!')
            return

        session = self.session()
        try:
            # save finished order & up_order
            for x in range(40):
                order_id = master.srandmember('list:finish')

                if order_id is None:
                    break

                r = self.persist_single(order_id, session, master, MODE_FINISHED)

                if r != 0:
                    master.sadd('list:error', order_id)

                master.srem('list:finish', order_id)
                master.srem('list:save', order_id)

            # save unfinished order
            for x in range(40):
                order_id = master.srandmember('list:save')

                if order_id is None:
                    break

                self.persist_single(order_id, session, master, MODE_UNFINISHED)

                master.srem('list:save', order_id)

        except Exception as e:
            task_log.error('TASK ORDER FAIL %s', e)
        finally:
            session.close()
            task_log.debug('TASK ORDER FINISH')


if __name__ == "__main__":
    import os

    print(os.getenv('PYTHONPATH'))

    cfg = yaml.load(open('logging-task-order.yaml', 'r'))
    logging.config.dictConfig(cfg)

    task = OrderTask()
    while True:
        task.persist_all()
        time.sleep(10)
