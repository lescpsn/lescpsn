from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

order_map = {}
up_order_map = {}

Base = declarative_base()


def get_card_up_order_shard(user_id):
    if user_id not in up_order_map:
        up_order_map[user_id] = type('CardUpOrder_' + user_id, (CardUpOrder,),
                                     {'__tablename__': 'card_up_order_' + user_id})
    return up_order_map[user_id]


def get_card_order_shard(user_id):
    if user_id not in order_map:
        order_map[user_id] = type('CardOrder_' + user_id, (CardOrder,),
                                  {'__tablename__': 'card_order_' + user_id})
    return order_map[user_id]


class CardOrder(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    order_id = Column(String)
    user_id = Column(String)
    price = Column(Integer)
    mobile = Column(String)
    req_time = Column(DateTime)
    resp_time = Column(DateTime)
    back_time = Column(DateTime)
    result = Column(String)
    back_result = Column(String)

    def __repr__(self):
        return "<CardOrder(order_id='%s')>" % self.order_id


class CardUpOrder(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True)
    parse = Column(Integer)
    order_id = Column(String)
    card_id = Column(String)
    up_order_id = Column(String)
    route = Column(String)
    up_req_time = Column(DateTime)
    up_resp_time = Column(DateTime)
    up_back_time = Column(DateTime)
    up_result = Column(String)
    up_back_result = Column(String)

    def __repr__(self):
        return "<CardUpOrder(order_id='%s', parse=%d)>" % (self.up_order_id, self.parse)
