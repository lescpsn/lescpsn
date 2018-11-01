from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class Order(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    order_id = Column(String)
    user_id = Column(String)
    price = Column(Integer)
    mobile = Column(String)
    sp_order_id = Column(String)
    req_time = Column(DateTime)
    resp_time = Column(DateTime)
    back_time = Column(DateTime)
    result = Column(String)
    back_result = Column(String)
    value = Column(Integer)
    balance = Column(Integer)  # new
    area = Column(String)  # new
    product = Column(String)  # new2
    scope = Column(String)

    def __repr__(self):
        return "<Order(order_id='%s')>" % self.order_id


class UpOrder(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    stage = Column(Integer)
    order_id = Column(String)
    up_order_id = Column(String)
    route = Column(String)
    price = Column(Integer)
    cost = Column(Integer)
    up_cost = Column(String)
    up_req_time = Column(DateTime)
    up_resp_time = Column(DateTime)
    up_back_time = Column(DateTime)
    up_result = Column(String)
    up_back_result = Column(String)

    def __repr__(self):
        return "<UpOrder(up_order_id='%s')>" % self.up_order_id


class Transaction(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    trans_id = Column(String)
    type = Column(String)
    income = Column(Integer)
    outcome = Column(Integer)
    balance = Column(Integer)
    order_id = Column(String)
    user_id = Column(String)
    account = Column(String)
    name = Column(String)
    create_time = Column(DateTime)
    notes = Column(String)

    def __repr__(self):
        return "<Transaction(id='%s')>" % self.id


class Book(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    value = Column(Integer)
    operator = Column(String)
    create_time = Column(DateTime)
    signature = Column(String)
    notes = Column(String)

    def __repr__(self):
        return "<Book(id='%s')>" % self.id


class Account(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    last_balance = Column(Integer)
    last_id = Column(Integer)

    # outcome
    debit = Column(Integer)  # outcome
    debit_manual = Column(Integer)
    # income
    refund = Column(Integer)
    refund_manual = Column(Integer)
    deposit = Column(Integer)

    balance = Column(Integer)
    account_date = Column(Date)
    signature = Column(String)
    notes = Column(String)

    def __repr__(self):
        return "<Account(id='%s')>" % self.id
