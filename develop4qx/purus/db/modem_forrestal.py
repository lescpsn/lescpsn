from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class SinopecForrestalOrder(Base):
    __tablename__ = 'sinopec_forrestal_order'
    __table_args__ = {'schema' : 'madeira'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String)
    user_id = Column(String)
    account_number = Column(String)
    result = Column(String)
    status = Column(String)
    price = Column(Integer)
    account_price = Column(Integer)
    create_tsp = Column(DateTime)
    card_id = Column(String)
    ready_tsp = Column(DateTime)
    site = Column(String)
    bot_account = Column(String)
    site_req_tsp = Column(DateTime)
    site_result_tsp = Column(DateTime)
    site_msg = Column(String)
    site_result = Column(String)
    manual_user = Column(String)
    manual_result = Column(String)
    manual_result_tsp = Column(DateTime)