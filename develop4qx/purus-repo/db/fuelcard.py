from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

'''
DROP TABLE fuel_account;
CREATE TABLE fuel_account (
    id          INT(11)         NOT NULL AUTO_INCREMENT,
    user_id     VARCHAR(20)     NOT NULL,
    domain_id   VARCHAR(20)     NOT NULL,
    account     VARCHAR(100),
    password    VARCHAR(100),
    create_time DATETIME,
    update_time DATETIME,
    is_default  VARCHAR(20),
    status      VARCHAR(20),
    notes       VARCHAR(500),
    PRIMARY KEY (ID)
);
'''


class FuelAccount(Base):
    __tablename__ = 'fuel_account'

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    domain_id = Column(String)

    account = Column(String)
    password = Column(String)

    create_time = Column(DateTime)
    update_time = Column(DateTime)

    is_default = Column(String)
    status = Column(String)  # valid/invalid

    notes = Column(String)

    def __repr__(self):
        return "<FuelAccount(id=%d, user_id='%s', account='%s')>" % (self.id, self.user_id, self.account)
