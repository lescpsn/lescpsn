import logging
import logging.config
import datetime
import time
import traceback

from redis.sentinel import Sentinel
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_account_shard, get_trans_shard, get_order_shard


task_log = logging.getLogger("madeira.task")

debug = False


def load_config():
    with open('config.yaml', 'r') as stream:
        return yaml.load(stream)


USER_MAPPING = {}


def load_mapping(config=None):
    if config is None:
        config = load_config()

    for user_id in config['downstream']:
        if 'master' in config['downstream'][user_id]:
            master_id = config['downstream'][user_id]['master']
            task_log.debug('%s -> %s' % (user_id, master_id))
            USER_MAPPING[user_id] = master_id
        else:
            USER_MAPPING[user_id] = user_id


class AccountTask():
    def __init__(self):

        config = load_config()
        sentinels = [(c['ip'], c['port']) for c in config['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=1, decode_responses=True)

        engine = create_engine(
            config['database']['url'],
            pool_size=2, echo=debug, echo_pool=debug, pool_recycle=3600)

        self.session = sessionmaker(bind=engine)

        load_mapping(config)

    @staticmethod
    def accounting_user_day(user_id, day, session, last_account):

        task_log.info('VERIFY %s', day)

        verified = True

        # VERIFY
        master_id = USER_MAPPING[user_id]

        order_cls = get_order_shard(master_id)
        trans_cls = get_trans_shard(master_id)
        account_cls = get_account_shard()

        begin = datetime.datetime(day.year, day.month, day.day)
        end = begin + datetime.timedelta(1)

        # order -> trans
        orders = session.query(order_cls).filter(order_cls.user_id == user_id).filter(
            order_cls.req_time >= begin).filter(order_cls.req_time < end).order_by(
            order_cls.req_time)

        for order in orders.all():
            if order.result == '0':
                trans = session.query(trans_cls).filter(trans_cls.order_id == order.order_id).filter(
                    trans_cls.type == 'debit').first()

                if trans is None:
                    task_log.error('Order %s without debit', order.order_id)
                    verified = False
                    continue

                if trans.outcome != order.value:
                    task_log.error('Order %s without debit', order.order_id)
                    verified = False
                    continue

        # trans -> order
        trans_all = session.query(trans_cls).filter(trans_cls.user_id == user_id).filter(
            trans_cls.create_time >= begin).filter(
            trans_cls.create_time < end).order_by(trans_cls.create_time, trans_cls.trans_id)

        balance_in_order = -1
        if last_account:
            last_id = last_account.id
            balance = last_balance = last_account.balance
        else:
            last_id = 0
            balance = last_balance = 0

        total = {
            'deposit': 0,
            'debit': 0,
            'debit-manual': 0,
            'refund': 0,
            'refund-manual': 0,
        }

        for trans in trans_all.all():
            if trans.type != 'deposit':
                order = session.query(order_cls).filter(order_cls.order_id == trans.order_id).first()

                if order is None:
                    task_log.error('Trans %s without debit', trans.order_id)
                    verified = False
                    continue

            total[trans.type] += trans.income + trans.outcome
            balance = balance + trans.income - trans.outcome
            balance_in_order = trans.balance

        # task_log.debug('balance={balance}, final={final}'.format(balance=balance, final=balance_in_order))
        # task_log.debug(total)

        if balance_in_order != -1 and balance != balance_in_order:
            task_log.debug('balance=%.3f,in_order=%.3f' % (balance / 10000, balance_in_order / 10000))
            verified = False

        if verified:
            account = account_cls()
            account.user_id = user_id
            account.last_balance = last_balance
            account.last_id = last_id

            account.debit = total['debit']
            account.debit_manual = total['debit-manual']
            account.refund = total['refund']
            account.refund_manual = total['refund-manual']
            account.deposit = total['deposit']

            account.balance = balance
            account.account_date = begin

            session.add(account)
            session.commit()

            return account
        else:
            task_log.info('VERIFY result=%s', verified)
            return None

    def accounting_user(self, user_id, session):
        master_id = USER_MAPPING[user_id]

        yesterday = datetime.date.today() - datetime.timedelta(1)

        account_cls = get_account_shard()

        last = session.query(account_cls).filter(account_cls.user_id == user_id).order_by(
            desc(account_cls.account_date)).limit(1).first()

        if last:
            if last.account_date == yesterday:
                return
            else:
                start = last.account_date + datetime.timedelta(1)
        else:
            # find start date
            trans_cls = get_trans_shard(master_id)
            start = session.query(trans_cls.create_time).order_by(trans_cls.create_time).limit(1).scalar()
            task_log.debug('START FROM %s', start)
            if start is None:
                return
            start = start.date()

        # fix accounting data from last account or first day of trans
        task_log.info('VERIFY to %s', yesterday)
        day = start
        while day <= yesterday:
            last = self.accounting_user_day(user_id, day, session, last)
            if last is None:
                break
            day += datetime.timedelta(1)


    def accounting(self):
        task_log.info('TASK ACCOUNTING START')

        session = self.session()
        try:
            cfg = yaml.load(open('config.yaml', 'r'))

            user_list = sorted([user_id for user_id in cfg['downstream']])

            for user_id in user_list:
                if user_id in ['100001', '100002', '100003', '100004']:
                    continue
                task_log.info('TASK ACCOUNTING USER %s //////////////////////////////////', user_id)
                self.accounting_user(user_id, session)

        except Exception as e:
            traceback.print_exc()
            task_log.error('TASK ACCOUNTING FAIL %s', e)
        finally:
            session.close()
            task_log.info('TASK ACCOUNTING FINISH')


if __name__ == "__main__":
    cfg = yaml.load(open('logging-task-account.yaml', 'r'))
    logging.config.dictConfig(cfg)

    task = AccountTask()
    while True:
        task.accounting()
        time.sleep(12 * 60 * 60)