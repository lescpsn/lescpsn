# encoding: utf8
from sqlalchemy import Column, Integer, String, DateTime,Binary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.schema import UniqueConstraint

Base = declarative_base()


class Role(Base):
    __tablename__ = 'role'

    id = Column(Integer, primary_key=True)
    role_set = Column(String)
    role = Column(String)


class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    display_name = Column(String)
    avatar = Column(String)
    partner_id = Column(String)
    password = Column(String(100))
    role = Column(String(50))
    status = Column(String(20))

    def __repr__(self):
        return "<User(name='%s', role='%s')>" % (self.name, self.role)


class BatchInfo(Base):
    __tablename__ = 'batch_info'

    id = Column(Integer, primary_key=True)
    batch_id = Column(String)
    user_id = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    notes = Column(String)

    def __repr__(self):
        return "<BatchInfo(batch_id='%s')>" % self.batch_id


class BatchDetail(Base):
    __tablename__ = 'batch_detail'

    id = Column(Integer, primary_key=True)
    batch_id = Column(String)
    mobile = Column(String)
    carrier = Column(String)
    price = Column(Integer)
    stage = Column(Integer)
    order_id = Column(String)
    status = Column(String)

    def __repr__(self):
        return "<BatchDetail(batch_id='%s')>" % self.batch_id


class Routing(Base):
    __tablename__ = 'routing'

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    carrier = Column(Integer)
    area = Column(String)
    price = Column(Integer)
    routing = Column(String)
    status = Column(String)

    def __repr__(self):
        return "<Routing('route:{user_id}:fee:{carrier}:{area}:{price}')>".format(
                user_id=self.user_id,
                carrier=self.carrier,
                area=self.area,
                price=self.price)


'''
CREATE TABLE order_operation_log (
  id          INT(11) NOT NULL AUTO_INCREMENT,
  order_id    VARCHAR(40) NOT NULL,
  result_code VARCHAR(20) NOT NULL,
  operator_id VARCHAR(40),
  notes       VARCHAR(500),
  create_time DATETIME,
  PRIMARY KEY (id)
);
'''


class Operation(Base):
    __tablename__ = 'order_operation_log'

    id = Column(Integer, primary_key=True)
    order_id = Column(String)
    result_code = Column(String)
    operator_id = Column(String)
    notes = Column(String)
    create_time = Column(DateTime)


'''
CREATE TABLE pay_yeepay (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(20) NOT NULL,
  amount BIGINT(20) NOT NULL,
  fee BIGINT(20),
  pay_order_id VARCHAR(40) NOT NULL,
  create_time DATETIME,
  back_time DATETIME,
  pay_status VARCHAR(20),
  add_status VARCHAR(20),
  trx_id VARCHAR(20),
  PRIMARY KEY (id)
);
'''


class PayYeepay(Base):
    __tablename__ = 'pay_yeepay'

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    amount = Column(Integer)  # *10000
    fee = Column(Integer)  # *10000
    create_time = Column(DateTime)
    back_time = Column(DateTime)
    pay_order_id = Column(String)
    pay_status = Column(String)  # yeepay side status
    add_status = Column(String)  # madeira side status
    # yeepay important properties
    trx_id = Column(String)

    def __repr__(self):
        return "<PayYeepay(user_id={user_id}, amount={amount})>".format(
                user_id=self.user_id,
                amount=self.amount)


'''
CREATE TABLE deposit_quota (
  id          int(11)         NOT NULL AUTO_INCREMENT,
  operator_id varchar(20)     NOT NULL,
  type        varchar(20)     NOT NULL,
  amount      bigint(20)      NOT NULL,
  value       bigint(20)      NOT NULL,
  deposit_id  varchar(20)     DEFAULT NULL,
  create_time datetime        NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
'''


class DepositQuota(Base):
    __tablename__ = 'deposit_quota'

    id = Column(Integer, primary_key=True)
    operator_id = Column(String)
    type = Column(String)
    amount = Column(Integer)
    value = Column(Integer)
    deposit_id = Column(String)
    create_time = Column(DateTime)


'''
CREATE TABLE deposit (
  id          int(11)         NOT NULL AUTO_INCREMENT,
  user_id     varchar(20)     NOT NULL,
  channel     varchar(20)     NOT NULL,
  account     varchar(100)    NOT NULL,
  amount      bigint(20)      NOT NULL,
  status      varchar(20)     NOT NULL,
  operator_id varchar(20)     DEFAULT NULL,
  notes       varchar(500)    DEFAULT NULL,
  result      varchar(20)     DEFAULT NULL,
  create_time datetime        NOT NULL,
  update_time datetime        DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
'''


class Deposit(Base):
    __tablename__ = 'deposit'

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    channel = Column(String)
    account = Column(String)
    amount = Column(Integer)
    status = Column(String)
    operator_id = Column(String)
    notes = Column(String)
    result = Column(String)
    create_time = Column(DateTime)
    update_time = Column(DateTime)


# 油卡自定义客户
'''
CREATE TABLE IF NOT EXISTS `fuel_card_customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL COMMENT '用户ID',
  `card_id` varchar(19) NOT NULL COMMENT '油卡卡号',
  `name` varchar(50) NOT NULL COMMENT '名称',
  `notes` varchar(50) DEFAULT NULL COMMENT '备注信息',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `verify_info` varchar(50) DEFAULT NULL COMMENT '网站的验证信息',
  `verify_time` datetime DEFAULT NULL COMMENT '网站验证的时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_card_id` (`user_id`,`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='油卡客户自定义常用客户列表';
'''


class FuelCardCustomer(Base):
    __tablename__ = 'fuel_card_customer'
    __table_args__ = (
        UniqueConstraint("user_id", "card_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String)
    card_id = Column(String)
    name = Column(String)
    notes = Column(String)
    create_time = Column(DateTime)
    update_time = Column(DateTime)
    verify_info = Column(String)
    verify_time = Column(DateTime)


'''
CREATE TABLE IF NOT EXISTS `fuel_card_card_verify_record` (
  `card_id` varchar(50) NOT NULL COMMENT '卡号',
  `verify_data` varchar(500) DEFAULT NULL COMMENT '收到的验证结果json',
  `error_msg` varchar(500) DEFAULT NULL COMMENT '记录无法验证时的报错信息',
  `user_id` varchar(20) NOT NULL COMMENT '谁操作的',
  `verify_time` datetime NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用于存储所有验证过的卡号和密码';
'''


class FuelCardCardVerifyRecord(Base):
    __tablename__ = 'fuel_card_card_verify_record'

    card_id = Column(String, primary_key=True)
    verify_data = Column(String)
    error_msg = Column(String)
    user_id = Column(String)
    verify_time = Column(DateTime)


'''
CREATE TABLE `fuel_card_user` (
	`id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
	`user_id` VARCHAR(20) NOT NULL COMMENT '用户ID',
	`task_count` INT(11) UNSIGNED NOT NULL COMMENT '已建立的任务次数',
	`task_id_now` VARCHAR(40) NULL DEFAULT NULL COMMENT '该用户当前任务ID{user_id}{task_count}',
	PRIMARY KEY (`id`),
	UNIQUE INDEX `user_id` (`user_id`)
)
COMMENT='用于记录用户的任务ID号'
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=2
;
'''


class FuelCardUser(Base):
    __tablename__ = 'fuel_card_user'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String)  # 用户ID
    task_count = Column(Integer)  # 序列号起点
    task_id_now = Column(String)  # 当前任务ID


'''
CREATE TABLE `fuel_card_task` (
	`id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '任务ID，唯一标识',
	`user_id` VARCHAR(20) NOT NULL DEFAULT '0',
	`account` VARCHAR(20) NOT NULL COMMENT '待充值账号',
	`task_id` VARCHAR(40) NOT NULL COMMENT '任务ID',
	`task_status` ENUM('-1','0','1','2') NOT NULL COMMENT '-1:未知状态  0:停止 1:运行中  2:结束',
	`create_time` DATETIME NOT NULL COMMENT '任务创建时间',
	`price_list` VARCHAR(200) NOT NULL COMMENT 'json格式的面值列表',
	`total_price` INT(11) NULL DEFAULT NULL COMMENT '总面值',
	`total_order_count` INT(11) NULL DEFAULT NULL COMMENT '订单总数',
	PRIMARY KEY (`id`),
	UNIQUE INDEX `task_id` (`task_id`)
)
COMMENT='加油卡批量充值任务'
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=2
;
'''


class FuelCardTask(Base):
    __tablename__ = 'fuel_card_task'
    __table_args__ = {'schema': 'purus'}

    class Status:
        UNKNOWN = '-1'  # 未知状态
        PAUSE = '0'  # 暂停
        RUNNING = '1'  # 正在运行中
        COMPLETE = '2'  # 完成->指所有的订单都跑完，并充进去了指定的金额
        FINISH = '3'  # 结束

    @staticmethod
    def get_status_info(status):
        status_map = {
            '-1': '未知状态',
            '0': '已暂停',
            '1': '运行中',
            '2': '已完成',
            '3': '已结束',
        }
        return status_map.get(status, status)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String)  # 用户ID
    account = Column(String)  # 充值账号
    task_id = Column(String)  # 任务ID
    task_status = Column(String)  # 任务状态
    create_time = Column(DateTime)  # 任务创建时间
    start_time = Column(DateTime)  # 任务启动时间
    stop_time = Column(DateTime)  # 任务创建时间
    stop_count = Column(Integer)  # 已经暂停的次数
    finish_time = Column(DateTime)  # 任务创建时间
    price_list = Column(String)  # 面值信息列表
    total_price = Column(Integer)  # 面值总数量
    success_price = Column(Integer)  # 成功的订单金额
    total_order_count = Column(Integer)  # 订单总数量
    notes = Column(String)  # 备注信息
    complete_time = Column(DateTime)  #


class FuelCardOrder(Base):
    __tablename__ = 'fuel_card_task_order'
    __table_args__ = {'schema': 'purus'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String)  # 任务ID
    order_id = Column(String)  # 对应mad的下游订单号


class FuelCardStopHistory(Base):
    __tablename__ = 'fuel_card_stop_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String)  # 任务ID
    seq = Column(Integer)
    stop_time = Column(DateTime)
    order_id = Column(String)
    stop_info = Column(String)


class OperationLog(Base):
    """
    CREATE TABLE purus.operation_log (
      id            int             NOT NULL AUTO_INCREMENT,
      operator_id   varchar(20)     NOT NULL,
      module_id     varchar(100)    NOT NULL,
      operation     varchar(200)    NOT NULL,
      object        varchar(200)    DEFAULT NULL,
      value         varchar(200)    DEFAULT NULL,
      notes         varchar(500)    DEFAULT NULL,
      create_date   datetime        DEFAULT NULL,

      PRIMARY KEY (id)
    ) DEFAULT CHARSET=utf8;
    """

    __tablename__ = 'operation_log'
    id = Column(Integer, primary_key=True)
    module_id = Column(String)
    operator_id = Column(String)
    operation = Column(String)
    object = Column(String)
    notes = Column(String)
    create_date = Column(DateTime)
    value = Column(String)

    def __repr__(self):
        return "<PurusUpstream(id={id}, module_id={module_id})>".format(
                id=self.id,
                module_id=self.module_id)

#提现记录表
class WithdrawRecord(Base):
    '''
    CREATE TABLE `withdraw_record` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `user_id` VARCHAR(20) NULL DEFAULT NULL COMMENT '用户ID',
        `withdraw_id` VARCHAR(20) NULL DEFAULT NULL COMMENT '提现编号',
        `settle_start_time` DATETIME NULL DEFAULT NULL COMMENT '结算使用的开始时间',
        `settle_end_time` DATETIME NULL DEFAULT NULL COMMENT '结算使用的结束时间',
        `status` ENUM('wait_settle','wait_examine','wait_withdraw','success','fail','settle_zero') NULL DEFAULT NULL COMMENT '待结算->待审核->待提款->成功/失败， 结算金额为0也不需要处理',
        `status_time` DATETIME NULL DEFAULT NULL COMMENT '状态时间',
        `bank_user_name` VARCHAR(50) NULL DEFAULT NULL COMMENT '银行账号开户名',
        `bank_account` VARCHAR(20) NULL DEFAULT NULL COMMENT '银行账号',
        `bank_of_deposit` VARCHAR(100) NULL DEFAULT NULL COMMENT '银行账号开户行',
        `income_money` BIGINT(20) NULL DEFAULT NULL COMMENT '本期收入',
        `withdraw_money` BIGINT(20) NULL DEFAULT NULL COMMENT '提现金额',
        `examine_operator` VARCHAR(50) NULL DEFAULT NULL COMMENT '审核操作员',
        `withdraw_operator` VARCHAR(50) NULL DEFAULT NULL COMMENT '提现操作员',
        `withdraw_time` DATETIME NULL DEFAULT NULL COMMENT '提现操作时间',
        `fail_notes` VARCHAR(500) NULL DEFAULT NULL COMMENT '人工点失败时的备注信息',
        `notes_for_user` VARCHAR(500) NULL DEFAULT NULL COMMENT '给用户的备注',
        `notes_for_system` VARCHAR(500) NULL DEFAULT NULL COMMENT '给系统内部的备注',
        `withdraw_img` BLOB NULL COMMENT '流水截图',
        `have_withdraw_img` TINYINT(4) NULL DEFAULT NULL COMMENT 'NULL表示无,其他值表示有',
        PRIMARY KEY (`id`),
        UNIQUE INDEX `withdraw_id` (`withdraw_id`)
    )
    COMMENT='供货商的提现记录'
    COLLATE='utf8_general_ci'
    ENGINE=InnoDB
    AUTO_INCREMENT=0
    ;
    '''

    @staticmethod
    def get_status_name(status):
        status_map = {
            'wait_settle': '等待结算',
            'wait_examine': '未处理',
            'wait_withdraw': '处理中',
            'success': '处理成功',
            'fail': '处理失败',
            'settle_zero': '自动完成',
        }
        return status_map.get(status, status)

    __tablename__ = 'withdraw_record'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String)
    withdraw_id = Column(String, unique=True)
    settle_start_time = Column(DateTime)
    settle_end_time = Column(DateTime)
    status = Column(String)
    status_time = Column(DateTime)
    bank_user_name = Column(String)
    bank_account = Column(String)
    bank_of_deposit = Column(String)
    income_money = Column(Integer)
    withdraw_money = Column(Integer)
    withdraw_time = Column(DateTime)
    examine_operator = Column(String)
    withdraw_operator = Column(String)
    fail_notes = Column(String)
    notes_for_user = Column(String)
    notes_for_system = Column(String)
    withdraw_img_name = Column(String)


#提现记录表
class WithdrawRecord2(Base):
    __tablename__ = 'withdraw_record'
    __table_args__ = {'extend_existing':True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    withdraw_img = Column(Binary)
    withdraw_img_name = Column(String)

