from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import yaml
import bisect

from db.model import Transaction, Order, Book, UpOrder


def do_fix():
    """

    """

    try:
        session = Session()

        q = session.query(Transaction).filter(Transaction.user_id == '200801').order_by(Transaction.id)

        balance = 0
        for trans in q.all():
            balance = balance + trans.income - trans.outcome

            if balance != trans.balance:
                print(trans)
                print('%d vs %d' % (balance, trans.balance))
                trans.balance = balance

        session.commit()

    finally:
        session.close()


if __name__ == "__main__":
    config = yaml.load(open('config.yaml', 'r'))
    url = config['database']['url']
    engine = create_engine(url, pool_size=2, echo=True, echo_pool=True, pool_recycle=3600)
    Session = sessionmaker(bind=engine)

    # fix_deposit()
    do_fix()