# -*- coding:utf-8 -*-

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class RepoUser(Base):
    """
    DROP TABLE repo_user;
    CREATE TABLE repo_user (
        id          INT(11)         NOT NULL AUTO_INCREMENT,
        user_id     VARCHAR(20)     NOT NULL,
        domain_id   VARCHAR(20)     NOT NULL,
        name        VARCHAR(200),
        master_id   VARCHAR(20),
        shard_id    VARCHAR(20),
        type        VARCHAR(20),
        password    VARCHAR(20),
        secret      VARCHAR(20),
        iv          VARCHAR(20),
        back_url    VARCHAR(500),
        tags        VARCHAR(200),
        level       VARCHAR(10),
        prefix      VARCHAR(10),
        status      VARCHAR(20),
        create_time DATETIME,
        update_time DATETIME,
        cooperation VARCHAR(50),
        qq          VARCHAR(20),
        mobile      VARCHAR(20),
        notes       VARCHAR(200),
        services    VARCHAR(500),
        details     VARCHAR(500),

        account_name   VARCHAR(200),
        account_number VARCHAR(100),
        account_bank   VARCHAR(200),
        PRIMARY KEY (ID)
    );

    ALTER TABLE repo_user ADD COLUMN account_name VARCHAR(200) NULL AFTER details;
    ALTER TABLE repo_user ADD COLUMN account_number VARCHAR(200) NULL AFTER account_name;
    ALTER TABLE repo_user ADD COLUMN account_bank VARCHAR(200) NULL AFTER account_number;
    """

    __tablename__ = 'repo_user'

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    domain_id = Column(String)
    name = Column(String)
    master_id = Column(String)
    shard_id = Column(String)
    type = Column(String)
    password = Column(String)
    secret = Column(String)
    iv = Column(String)
    back_url = Column(String)
    tags = Column(String)
    level = Column(String)
    prefix = Column(String)
    status = Column(String)
    create_time = Column(DateTime)
    update_time = Column(DateTime)
    cooperation = Column(String)
    qq = Column(String)
    mobile = Column(String)
    notes = Column(String)
    services = Column(String)
    details = Column(String)
    account_name = Column(String)  # for sup
    account_number = Column(String)  # for sup
    account_bank = Column(String)  # for sup

    def __repr__(self):
        return "<User(id=%d, user_id='%s', name='%s')>" % (self.id, self.user_id, self.name)


class RepoLevel(Base):
    """
    CREATE TABLE repo_level (
        id          INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id   VARCHAR(20)     NOT NULL,
        level       VARCHAR(10)     NOT NULL,
        name        VARCHAR(200)    NOT NULL,
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_level'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    level = Column(String)
    name = Column(String)


# ALTER TABLE repo.repo_domain ADD id_start VARCHAR(20) NULL AFTER status;
# ALTER TABLE repo.repo_domain ADD id_end VARCHAR(20) NULL AFTER id_start;
class RepoDomain(Base):
    """
    DROP TABLE repo_domain;
    CREATE TABLE repo_domain (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        domain_name     VARCHAR(200)    NOT NULL,
        title           VARCHAR(200)    NOT NULL,
        hosts           VARCHAR(500)    NOT NULL,
        up_domain       VARCHAR(40),
        up_user         VARCHAR(40),
        status          VARCHAR(20)     NOT NULL,
        create_time     DATETIME,
        id_start        VARCHAR(20),
        id_end          VARCHAR(20),
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_domain'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    domain_name = Column(String)
    title = Column(String)
    hosts = Column(String)
    up_domain = Column(String)
    up_user = Column(String)
    id_start = Column(String)
    id_end = Column(String)
    status = Column(String)
    create_time = Column(DateTime)

    def __repr__(self):
        return "<RepoDomain(id=%d, domain_id='%s')>" % (self.id, self.domain_id)


class RepoOperator(Base):
    """
    DROP TABLE repo_operator;
    CREATE TABLE repo_operator (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        user_id         VARCHAR(20),
        login           VARCHAR(200),
        name            VARCHAR(200),
        password        VARCHAR(40),
        role            VARCHAR(20),
        status          VARCHAR(20),
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_operator'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    user_id = Column(String)
    login = Column(String)
    name = Column(String)
    password = Column(String)
    role = Column(String)
    status = Column(String)

    def __repr__(self):
        return "<RepoOperator(id=%d, login='%s')>" % (self.id, self.login)


class RepoTemplate(Base):
    """
    DROP TABLE repo_template;
    CREATE TABLE repo_template (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        template_id     VARCHAR(40)     NOT NULL,
        template_name   VARCHAR(40)     NOT NULL,

        user_id_start   VARCHAR(20),
        user_id_end     VARCHAR(20),
        master_id       VARCHAR(20),
        shard_id        VARCHAR(20),
        type            VARCHAR(20),
        password        VARCHAR(20),
        secret          VARCHAR(20),
        iv              VARCHAR(20),
        back_url        VARCHAR(500),
        level           VARCHAR(10),
        prefix          VARCHAR(10),
        status          VARCHAR(20),
        cooperation     VARCHAR(50),
        qq              VARCHAR(20),
        mobile          VARCHAR(20),
        notes           VARCHAR(200),
        services        VARCHAR(500),
        role            VARCHAR(50),
        PRIMARY KEY (id)
    );
    """
    __tablename__ = 'repo_template'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    template_id = Column(String)
    template_name = Column(String)

    user_id_start = Column(String)
    user_id_end = Column(String)
    master_id = Column(String)
    shard_id = Column(String)
    type = Column(String)
    password = Column(String)
    secret = Column(String)
    iv = Column(String)
    back_url = Column(String)
    level = Column(String)
    prefix = Column(String)
    status = Column(String)
    cooperation = Column(String)
    qq = Column(String)
    mobile = Column(String)
    notes = Column(String)
    services = Column(String)
    role = Column(String)

    def __repr__(self):
        return "<RepoTemplate(id=%d, template_id='%s', name='%s')>" % (self.id, self.template_id, self.template_name)


class RepoService(Base):
    """
    DROP TABLE repo_service;
    CREATE TABLE repo_service (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domains         VARCHAR(500),
        service_id      VARCHAR(20)     NOT NULL,
        type            VARCHAR(50),
        sharding        VARCHAR(500),
        sync_user       VARCHAR(500),
        sync_product    VARCHAR(500),
        sync_key        VARCHAR(500),
        status          VARCHAR(20),
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_service'

    id = Column(Integer, primary_key=True)
    domains = Column(String)
    service_id = Column(String)
    type = Column(String)
    sharding = Column(String)
    sync_user = Column(String)
    sync_product = Column(String)
    sync_key = Column(String)
    status = Column(String)
    roles = Column(String)

    def __repr__(self):
        return "<RepoService(id=%d, service_id='%s')>" % (self.id, self.service_id)


class RepoProductCatalog(Base):
    """
    DROP TABLE repo_product_catalog;
    CREATE TABLE repo_product_catalog (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        catalog_id      VARCHAR(20)     NOT NULL,
        name            VARCHAR(200)    NOT NULL,
        PRIMARY KEY (id)
    );
    """
    __tablename__ = 'repo_product_catalog'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    catalog_id = Column(String)
    name = Column(String)

    def __repr__(self):
        return "<RepoProductCatalog(id=%s, name='%s')>" % (self.catalog_id, self.name)


class RepoProduct(Base):
    """
    DROP TABLE repo_product;
    CREATE TABLE repo_product (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        catalog_id      VARCHAR(20),
        product_id      VARCHAR(20)     NOT NULL,
        name            VARCHAR(200)    NOT NULL,
        type            VARCHAR(50),
        carrier         VARCHAR(10),
        price           INT(11),
        value           INT(11),
        area            VARCHAR(20)     NOT NULL,
        use_area        VARCHAR(20),
        p1              INT(11),
        p2              INT(11),
        p3              INT(11),
        p4              INT(11),
        p5              INT(11),
        scope           VARCHAR(20),
        legacy_id       VARCHAR(20),
        routing         VARCHAR(1000),
        notes           VARCHAR(200),
        status          VARCHAR(20),
        update_time     DATETIME,
        PRIMARY KEY (id)
    );

    ALTER TABLE repo_product ADD COLUMN catalog_id VARCHAR(20) NULL AFTER domain_id;
    """

    __tablename__ = 'repo_product'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    catalog_id = Column(String)
    product_id = Column(String)
    name = Column(String)
    type = Column(String)
    carrier = Column(String)
    price = Column(Integer)
    value = Column(Integer)
    area = Column(String)
    use_area = Column(String)
    p1 = Column(Integer)
    p2 = Column(Integer)
    p3 = Column(Integer)
    p4 = Column(Integer)
    p5 = Column(Integer)
    scope = Column(String)
    legacy_id = Column(String)
    routing = Column(String)
    notes = Column(String)
    status = Column(String)
    update_time = Column(DateTime)

    def __repr__(self):
        return "<RepoProduct(id=%d, name='%s', catalog_id=%s, price=%s, routing=%s,\
p2=%s, status=%s, %s)>" % (self.id, self.name, self.catalog_id, self.price, self.routing, self.p2,self.status,self.area)


class RepoSpecial(Base):
    """
    DROP TABLE repo_special;
    CREATE TABLE repo_special (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        user_id         VARCHAR(20)     NOT NULL,
        product_id      VARCHAR(20)     NOT NULL,
        value           INT(11),
        status          VARCHAR(20),
        supply          VARCHAR(20),
        notes           VARCHAR(500),
        update_time     DATETIME,
        update_status_time     DATETIME,
        update_supply_time     DATETIME,
        update_value_time     DATETIME,
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_special'

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    product_id = Column(String)
    value = Column(String)
    status = Column(String)
    supply = Column(String)
    notes = Column(String)
    update_time = Column(DateTime)
    update_status_time = Column(DateTime)
    update_supply_time = Column(DateTime)
    update_value_time = Column(DateTime)

    def __repr__(self):
        return "<RepoSpecial(id=%d, user_id='%s', status='%s')>" % (self.id, self.user_id, self.status)


class RepoSyncLog(Base):
    """
    DROP TABLE repo_sync_log;
    CREATE TABLE repo_sync_log (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        service_id      VARCHAR(20)     NOT NULL,
        type            VARCHAR(20)     NOT NULL,
        result          VARCHAR(20)     NOT NULL,
        create_time     DATETIME,
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_sync_log'

    id = Column(Integer, primary_key=True)
    service_id = Column(String)
    type = Column(String)  # user/pricing
    result = Column(String)
    create_time = Column(DateTime)

    def __repr__(self):
        return "<RepoSyncLog(id=%d, result='%s')>" % (self.id, self.result)


# downstream -> product -> supply -> interface
# ALTER TABLE repo.repo_route_supply ADD backup VARCHAR(2000) NULL AFTER interfaces;
# ALTER TABLE repo.repo_route_supply ADD restriction VARCHAR(100) NULL AFTER backup;
class RepoRouteSupply(Base):
    """
    DROP TABLE repo_route_supply;
    CREATE TABLE repo_route_supply (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,

        name            VARCHAR(200)    NOT NULL,
        score           INT(11)         NOT NULL,
        area            VARCHAR(200)    NOT NULL,
        adapt_flag      VARCHAR(20)     NOT NULL,
        interfaces      VARCHAR(2000)   NOT NULL,
        backup          VARCHAR(2000),
        restriction     VARCHAR(100),

        status          VARCHAR(20),
        notes           VARCHAR(500),

        create_time     DATETIME,
        update_time     DATETIME,
        PRIMARY KEY (id)
    );

    ALTER TABLE repo.repo_route_supply ADD score INT NULL AFTER name;
    """

    __tablename__ = 'repo_route_supply'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)

    name = Column(String)
    score = Column(Integer)
    area = Column(String)
    adapt_flag = Column(String)
    interfaces = Column(String)
    backup = Column(String)
    restriction = Column(String)

    status = Column(String)
    notes = Column(String)

    create_time = Column(DateTime)
    update_time = Column(DateTime)

    def __repr__(self):
        return "<RepoRouteSupply(id=%d, interfaces='%s')>" % (self.id, self.interfaces)

# upstream interface
class RepoRouteInterface(Base):
    """
    DROP TABLE repo_route_interface;
    CREATE TABLE repo_route_interface (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        interface_id    VARCHAR(100)    NOT NULL,
        name            VARCHAR(200)    NOT NULL,
        score           INT(11),

        carrier         VARCHAR(200),
        area            VARCHAR(200),

        create_time     DATETIME,
        PRIMARY KEY (id)
    );

    ALTER TABLE repo.repo_route_interface ADD score INT NULL AFTER name;
    """

    __tablename__ = 'repo_route_interface'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)

    interface_id = Column(String)
    name = Column(String)
    score = Column(Integer)

    carrier = Column(String)
    area = Column(String)

    create_time = Column(DateTime)

    def __repr__(self):
        return "<RepoRouteInterface(name=%s)>" % self.name


# interface -> interface-price
# ALTER TABLE repo.repo_interface_price ADD score INT DEFAULT 10000000 NOT NULL AFTER value;
class RepoInterfacePrice(Base):
    """
    DROP TABLE repo_interface_price;
    CREATE TABLE repo_interface_price (
        id              INT(11)         NOT NULL AUTO_INCREMENT,
        domain_id       VARCHAR(20)     NOT NULL,
        interface_id    VARCHAR(100)    NOT NULL,

        product_id      VARCHAR(200)    NOT NULL,
        value           INT(11),
        score           INT(11),

        create_time     DATETIME,
        PRIMARY KEY (id)
    );
    """

    __tablename__ = 'repo_interface_price'

    id = Column(Integer, primary_key=True)
    domain_id = Column(String)
    interface_id = Column(String)
    product_id = Column(String)
    value = Column(Integer)
    score = Column(Integer)
    create_time = Column(DateTime)

    def __repr__(self):
        return "<RepoInterfacePrice(id=%i, value=%s, score=%s)>" % (self.id, self.value, self.score)
