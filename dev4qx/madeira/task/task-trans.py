from datetime import datetime
import logging
import logging.config
import os
import time

from redis.sentinel import Sentinel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_trans_shard, get_book_shard

task_log = logging.getLogger("madeira.task")


def load_config():
    with open('config.yaml', 'r', encoding='utf8') as stream:
        return yaml.load(stream)


MASTER_MAPPING = {}
MASTER_TIME = -1


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


class TransTask():
    def __init__(self):

        core_cfg = load_mapping(True)

        sentinels = [(c['ip'], c['port']) for c in core_cfg['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=1, decode_responses=True)

        engine = create_engine(
            core_cfg['database']['url'],
            pool_size=2, echo=True, echo_pool=True, pool_recycle=3600)

        self.session = sessionmaker(bind=engine)

        self.site_id = core_cfg['config']['site']

    def persist_single(self, finance, session, master):
        task_log.info('SAVING %s', finance)

        try:
            uid = master.incr('uid:trans')
            # type|income|outcome|balance|order_id|user_id|account|name|t
            f_list = finance.split('|')

            _type = f_list[0]
            income = int(f_list[1])
            outcome = int(f_list[2])
            balance = int(f_list[3])
            order_id = f_list[4]
            user_id = f_list[5]
            account = f_list[6]
            name = f_list[7]
            t = float(f_list[8])
            notes = None

            if user_id not in MASTER_MAPPING:
                task_log.info("RELOAD CONFIG FOR %s", user_id)
                load_mapping()

            master_id = MASTER_MAPPING[user_id]

            # Level 2
            # type|income|outcome|balance|order_id|user_id|account|name|t|operator|sign|notes
            if len(f_list) >= 12:
                operator = f_list[9]
                sign = f_list[10]
                notes = f_list[11]

            create_time = datetime.fromtimestamp(t)
            tsp = create_time.strftime("%Y%m%d%H%M%S")
            trans_id = 'F%s%s%07d' % (tsp, self.site_id, uid)

            trans_cls = get_trans_shard(master_id)

            transaction = trans_cls()
            transaction.trans_id = trans_id
            transaction.type = _type
            transaction.income = income
            transaction.outcome = outcome
            transaction.balance = balance
            transaction.order_id = order_id
            transaction.user_id = user_id
            transaction.account = account
            transaction.name = name
            transaction.create_time = create_time
            transaction.notes = notes

            session.add(transaction)

            if _type == 'deposit':
                book_cls = get_book_shard(master_id)

                book = book_cls()
                book.user_id = user_id
                book.value = income
                book.operator = operator
                book.create_time = tsp
                book.signature = sign
                book.notes = notes
                session.add(book)

            session.commit()
            return 0

        except Exception as e:
            task_log.exception("persist_single")
            return -1

    def persist(self):
        load_mapping()

        # task_log.debug('persist')
        master = self.sentinel.master_for('madeira')

        if master.exists('flag:task'):
            task_log.info('STOP FLAG FOUND!')
            return

        session = self.session()
        try:
            for x in range(40):
                finance = master.rpop('finance')

                if finance is None:
                    break

                r = self.persist_single(finance, session, master)
                if r == -1:
                    task_log.error("FAIL ON %s", finance)
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
