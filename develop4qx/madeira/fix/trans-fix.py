from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import yaml
import bisect

from db.model import Transaction, Order, Book, UpOrder

'''
09-17 13:26 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-17 13:27 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-17 15:10 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-17 15:11 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-18 18:01 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-18 18:02 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-27 12:38 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-27 12:38 madeira.request INFO     None ADD POINT 200801->100000000@wangtao
09-28 16:37 madeira.request INFO     None ADD POINT 200801->300000000@wangtao
09-29 11:12 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-29 11:12 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-30 10:11 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-30 10:11 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-30 15:20 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
09-30 15:20 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
10-03 10:59 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
10-05 11:02 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
10-05 11:02 madeira.request INFO     None ADD POINT 200801->500000000@wangtao
'''
books = [
    ['500000', 'yangxq', '2014-09-15 12:00:00'],
    ['500000000', 'yangxq', '2014-09-15 18:00:00'],
    ['500000000', 'wangtao', '2014-09-17 13:26:45'],
    ['500000000', 'wangtao', '2014-09-17 13:27:09'],
    ['500000000', 'wangtao', '2014-09-17 15:10:47'],
    ['500000000', 'wangtao', '2014-09-17 15:11:11'],
    ['500000000', 'wangtao', '2014-09-18 18:01:54'],
    ['500000000', 'wangtao', '2014-09-18 18:02:08'],
    ['500000000', 'wangtao', '2014-09-27 12:38:12'],
    ['100000000', 'wangtao', '2014-09-27 12:38:19'],
    ['300000000', 'wangtao', '2014-09-28 16:37:14'],
    ['500000000', 'wangtao', '2014-09-29 11:12:20'],
    ['500000000', 'wangtao', '2014-09-29 11:12:24'],
    ['500000000', 'wangtao', '2014-09-30 10:11:39'],
    ['500000000', 'wangtao', '2014-09-30 10:11:42'],
    ['500000000', 'wangtao', '2014-09-30 15:20:16'],
    ['500000000', 'wangtao', '2014-09-30 15:20:21'],
    ['500000000', 'wangtao', '2014-10-03 10:59:15'],
    ['500000000', 'wangtao', '2014-10-05 11:02:45'],
    ['500000000', 'wangtao', '2014-10-05 11:02:48'],
]

'''
    !id = Column(Integer, primary_key=True)
    !trans_id = Column(String)
    type = Column(String)
    income = Column(Integer)
    outcome = Column(Integer)
    !balance = Column(Integer)
    !order_id = Column(String)
    !user_id = Column(String)
    account = Column(String)
    name = Column(String)
    create_time = Column(DateTime)
    notes = Column(String)
'''


class SortedTrans(object):
    def __init__(self, create_time, income=0, outcome=0, trans_type=None, order_id=None, account=None, name=None):
        self.create_time = create_time
        self.income = income
        self.outcome = outcome
        self.trans_type = trans_type
        self.order_id = order_id
        self.user_id = '200801'
        self.account = account
        self.name = name


    def __repr__(self):
        return '<Trans id=%23s, time=%s, type=%14s, income=%9d, outcome=%9d, balance=%10d>' % (
            self.order_id, self.create_time, self.trans_type, self.income, self.outcome, self.balance)

    def __lt__(self, other):
        # print('__lt__')
        return self.create_time < other.create_time

    def __gt__(self, other):
        # print('__gt__')
        return self.create_time > other.create_time


def fix_deposit():
    """
    """
    try:
        session = Session()

        q = session.query(Book).order_by(Book.create_time).all()

        for book in q:
            # print(book.value)
            tsp = book.create_time.strftime("%Y%m%d%H%M%S")
            trans_id = 'F%s%08d' % (tsp, 1)

            trans = Transaction(
                trans_id=trans_id,
                type='deposit',
                income=book.value,
                outcome=0,
                balance=0,
                order_id=None,
                user_id=book.user_id,
                account=None,
                name=None,
                create_time=book.create_time,
                notes='by ' + book.operator
            )

            session.add(trans)
            session.commit()

    finally:
        session.close()


trans_list = []


def add_tui():
    # 2014/10/12 15:43:24,98.4,37959.938,XS140930029030,
    try:
        session = Session()

        tui_file = open('fix/tui.csv', 'r')
        for line in tui_file:
            data = line.strip().split(',')
            create_time = datetime.strptime(data[1], '%Y/%m/%d %H:%M:%S')
            sp_order_id = data[4]
            order_id = data[5]

            order = session.query(Order).filter(Order.order_id == order_id).first()

            if order:
                # refund
                # create_time, income=0, outcome=0, trans_type=None, order_id=None, account=None, name=None
                s = SortedTrans(
                    create_time=create_time,
                    trans_type='refund-manual',
                    income=order.value,
                    order_id=order.order_id,
                    account=order.mobile)

                bisect.insort(trans_list, s)
            else:
                print(order_id)

    finally:
        session.close()


def add_order_trans():
    """

    """

    try:
        session = Session()

        q = session.query(Order).filter(Order.user_id == '200801').filter(
            Order.order_id < 'Q2014101122314300050003').filter(Order.result == 0).order_by(
            Order.order_id)

        for order in q.all():
            # depsit
            # create_time, income=0, outcome=0, trans_type=None, order_id=None, account=None, name=None
            s = SortedTrans(
                create_time=order.req_time,
                trans_type='debit',
                outcome=order.value,
                order_id=order.order_id,
                account=order.mobile)

            bisect.insort(trans_list, s)

            if order.back_result == '9':
                create_time = order.back_time or order.resp_time

                s = SortedTrans(
                    create_time=create_time,
                    trans_type='refund',
                    income=order.value,
                    order_id=order.order_id,
                    account=order.mobile)

                bisect.insort(trans_list, s)

    finally:
        session.close()


def add_book():
    for book in books:
        value = int(book[0])
        create_time = datetime.strptime(book[2], '%Y-%m-%d %H:%M:%S')

        s = SortedTrans(
            create_time=create_time,
            trans_type='deposit',
            income=value)

        bisect.insort(trans_list, s)


def do_fix():
    balance = 0
    f = open('trans.txt', 'w')
    i = 0

    try:
        session = Session()

        for trans in trans_list:
            balance = balance + trans.income - trans.outcome
            trans.balance = balance
            i += 1

            # F 2014 10 10 16 21 55 00000002
            t = Transaction(id=i,
                            trans_id='F%s%08d' % (trans.create_time.strftime('%Y%m%d%H%M%S'), i),
                            type=trans.trans_type,
                            income=trans.income,
                            outcome=trans.outcome,
                            balance=balance,
                            order_id=trans.order_id,
                            user_id='200801',
                            account=trans.account,
                            create_time=trans.create_time)

            session.add(t)
            if i % 100 == 0:
                print('commit...')
                session.commit()

            f.write('%5d %s\n' % (i, trans))

        f.close()

    finally:
        session.close()


if __name__ == "__main__":
    config = yaml.load(open('config.yaml', 'r'))

    url = config['database']['url']

    engine = create_engine(url, pool_size=2, echo=False, echo_pool=True, pool_recycle=3600)

    Session = sessionmaker(bind=engine)

    # fix_deposit()
    add_book()
    add_order_trans()
    add_tui()
    do_fix()