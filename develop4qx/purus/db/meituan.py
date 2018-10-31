from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class MeituanOrder(Base):
    __tablename__ = 'meituan_order'

    id = Column(Integer, primary_key=True,autoincrement=True)
    meituan_order_id = Column(String)
    quxun_order_id = Column(String)
    mobile = Column(String)
    product_id = Column(String)
    order_state = Column(String)
    meituan_sn = Column(String)
    notes = Column(String)
    create_date = Column(DateTime)
    check_date = Column(DateTime)
    finish_date = Column(DateTime)




