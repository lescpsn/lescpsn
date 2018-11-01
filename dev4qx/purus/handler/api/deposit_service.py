# -*- coding: utf8 -*-s
import hashlib
import math
from handler import JsonHandler
import tornado.web
from tornado import gen
from tornado.httpclient import HTTPRequest, AsyncHTTPClient
import json
import datetime
import logging
import re
from db.purus import Deposit, DepositQuota
from sqlalchemy import desc, or_, and_
import onetimepass as otp

request_log = logging.getLogger("purus.request")


def escape_result(result):
    return {
        'ok': '加款成功',
        'unknown': '加款异常',
        'fail': '加款失败',
    }.get(result, result)


def get_status(key):
    return {'apply': '待审核',
            'pass': '通过',
            'reject': '不通过',
            }.get(key)


def get_channel(key):
    return {'alipay': '支付宝',
            'debit_card': '银行卡',
            'account': '公帐',
            'busi-alipay': '企业支付宝'
            }.get(key)


def signature(part):
    m = hashlib.md5()
    m.update(part.encode('utf8'))
    return m.hexdigest().upper()


class ApiDepositApply(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    def post(self):
        args = self.json_args
        user_id = self.current_user['partner_id']
        channel = args.get('channel')
        if not channel or channel not in ['alipay', 'debit_card', 'account', 'busi-alipay']:
            self.finish(json.dumps({'status': 'fail', 'msg': '加款渠道错误'}))
            return

        account = args.get('account')
        if not account:
            self.finish(json.dumps({'status': 'fail', 'msg': '加款账号错误'}))
            return

        amount = args.get('amount')
        flag = re.match(r'^[0-9]{1,7}$', amount)
        if not flag:
            self.finish(json.dumps({'status': 'fail', 'msg': '加款金额错误'}))
            return
        amount = int(amount) * 10000
        status = 'apply'
        create_time = datetime.datetime.now()

        deposit = Deposit(user_id=user_id, channel=channel, account=account, amount=amount, status=status,
                          create_time=create_time)
        # insert db
        session = self.session('purus')

        try:
            session.add(deposit)
            session.commit()
        except Exception as e:
            request_log.exception('Insert db error: %s' % str(e))
            session.rollback()
            self.finish(json.dumps({'status': 'fail', 'msg': '操作失败'}))
            return
        finally:
            session.close()

        self.finish(json.dumps({'status': 'success', 'msg': '操作成功'}))


# 客户加款历史 客服审核列表
class ApiHistoryList(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    def post(self):
        args = self.json_args
        page = int(args.get('page'))
        size = int(args.get('size'))
        status = args.get('status')
        user_id = self.current_user['partner_id']

        # 是否为客服 是 显示所有申请 否 显示客户历史申请
        if 'admin-point' not in self.current_user['roles']:
            is_cs = False
        else:
            is_cs = True

        session = self.session('purus')
        his_list = []
        try:
            # 带状态过滤
            q = session.query(Deposit)
            if is_cs and status == 'apply':
                q = q.filter(Deposit.status == 'apply')
                desc_param = Deposit.create_time
            elif is_cs and status == 'finish':
                q = q.filter(or_(Deposit.status == 'pass', Deposit.status == 'reject'))
                desc_param = Deposit.update_time
            else:
                q = q.filter(Deposit.user_id == user_id)
                desc_param = Deposit.create_time

            max = math.ceil(q.count() / 10)
            q = q.order_by(desc(desc_param)) \
                .offset((page - 1) * size) \
                .limit(size)

            for d in q:
                if d.user_id in self.application.config['downstream']:
                    user_id = self.application.config['downstream'][d.user_id]['name']
                else:
                    user_id = d.user_id

                if d.operator_id in self.application.config['user']:
                    operator_name = self.application.config['user'][d.operator_id]['name']
                else:
                    operator_name = ''

                time_stamp = d.update_time or d.create_time
                o = {
                    'id': d.id,
                    'user_id': user_id,
                    'operator_name': operator_name,
                    'channel': get_channel(d.channel),
                    'account': d.account,
                    'amount': d.amount / 10000,
                    'status': get_status(d.status),
                    'time_stamp': str(time_stamp),
                    'result': escape_result(d.result),
                }

                his_list.append(o)

        except Exception as e:
            request_log.exception('Query history error: %s' % str(e))
            self.finish(json.dumps({'status': 'fail', 'msg': '加载列表失败'}))
            return
        finally:
            session.close()

        self.finish(json.dumps({'status': 'success', 'msg': '加载列表成功',
                                'data_list': his_list, 'max': max}))


# 限额list
class ApiDepositList(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    def post(self):
        user_cfg = self.application.config['user']

        session = self.session('purus')
        dep_list = []
        try:
            # 筛选operator_id
            # TODO: 待优化
            q = session.query(DepositQuota.operator_id).group_by(DepositQuota.operator_id)
            for op_id in q:
                oid = op_id[0]
                d = session.query(DepositQuota).filter(DepositQuota.operator_id == oid) \
                    .order_by(desc(DepositQuota.create_time)).first()

                if d.operator_id in user_cfg:
                    operator_name = '%s(%s)' % (user_cfg[d.operator_id]['name'], user_cfg[d.operator_id]['login'])
                else:
                    operator_name = d.operator_id

                o = {
                    'operator_name': operator_name,
                    'operator_id': d.operator_id,
                    'type': d.type,
                    'amount': d.amount / 10000,
                    'value': d.value / 10000,
                    'create_time': str(d.create_time)
                }
                dep_list.append(o)

        except Exception as e:
            request_log.exception('Query history error: %s' % str(e))
            self.finish(json.dumps({'status': 'fail', 'msg': '加载列表失败'}))
            return
        finally:
            session.close()
        self.finish(json.dumps({'status': 'success', 'msg': '加载列表成功', 'dep_list': dep_list}))


# 单个客服加款详情列表
class ApiDepositDetailList(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    def post(self):
        args = self.json_args
        operator_id = args.get('operator_id')
        page = int(args.get('page'))
        size = int(args.get('size'))
        session = self.session('purus')
        dep_detail = []
        try:
            q = session.query(DepositQuota).filter(DepositQuota.operator_id == operator_id)
            max = math.ceil(q.count() / 10)
            q = q.order_by(desc(DepositQuota.create_time)) \
                .offset((page - 1) * size) \
                .limit(size)

            type = ''
            for d in q:
                if d.type == 'deposit':
                    type = '客户加款'
                elif d.type == 'increase':
                    type = '增加限额'
                if d.deposit_id:
                    dep_name = self.application.config['downstream'][d.deposit_id]['name']
                else:
                    dep_name = d.deposit_id
                o = {
                    'deposit_id': dep_name,
                    'type': type,
                    'amount': d.amount / 10000,
                    'value': d.value / 10000,
                    'create_time': str(d.create_time)
                }
                dep_detail.append(o)
        except Exception as e:
            request_log.exception('Query history error: %s' % str(e))
            self.finish(json.dumps({'status': 'fail', 'msg': '加载列表失败'}))
            return
        finally:
            session.close()
        self.finish(json.dumps({'status': 'success', 'msg': '加载列表成功', 'dep_detail': dep_detail, 'max': max}))


# 加限额
class ApiDepositAdjust(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    def post(self):
        args = self.json_args
        operator_id = args.get('operator_id')
        amount = int(args.get('amount')) * 10000
        cur_time = datetime.datetime.now()
        # 管理员id
        op_id = self.current_user['id']

        # 校验授权
        flag = self.master.get('auth:%s:%s' % (op_id, 'quota'))
        if not flag:
            self.finish(json.dumps({'status': 'fail', 'msg': '授权失败'}))
            return

        session = self.session('purus')
        try:
            # deposit_quota 新增记录
            q = session.query(DepositQuota).filter(DepositQuota.operator_id == operator_id) \
                .order_by(desc(DepositQuota.id)).first()
            now_value = q.value
            cs_value = now_value + amount

            dep_quota = DepositQuota(operator_id=operator_id, type='increase', amount=amount,
                                     value=cs_value, create_time=cur_time)

            session.add(dep_quota)
            session.commit()
        except Exception as e:
            request_log.exception('Handle deposit error: %s' % str(e))
            self.finish(json.dumps({'status': 'fail', 'msg': '内部错误'}))
            session.rollback()
            return
        finally:
            session.close()

        self.finish(json.dumps({'status': 'success', 'msg': '操作成功'}))


# 申请处理
class ApiDepositApprove(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.gen.coroutine
    def post_fund(self, fund_type, order_id, user_id, income, notes=''):
        status = 'unknown'

        config = self.application.config.get('deposit_agent')
        secret = config.get('secret')
        operator = config.get('operator')

        downstream = self.application.config['downstream'].get(user_id)

        token = otp.get_totp(secret)

        sign0 = signature('{user_id}{order_id}{income}{operator}{token}'.format(
            user_id=user_id,
            order_id=order_id,
            income=income,
            operator=operator,
            token=token))

        body = json.dumps({'type': fund_type,
                           'order_id': order_id,
                           'user_id': user_id,
                           'income': income,
                           'operator': operator,
                           'token': token,
                           'notes': notes,
                           'sign': sign0})

        http_client = AsyncHTTPClient()

        try:
            url = downstream['shard']
            request_log.info("FUND_URL http://%s/admin/fund", url)
            request_log.info("FUND_BODY %s", body)
            request = HTTPRequest(url="http://%s/admin/fund" % url, method='POST', body=body,
                                  headers={'Content-Type': 'application/json'},
                                  request_timeout=120)

            response = yield http_client.fetch(request)

            if response.code == 200:
                msg = json.loads(response.body.decode())
                status = msg.get('status')
        except:
            request_log.exception("ERROR ADD FUND")
            status = 'unknown'

        return status

    @tornado.gen.coroutine
    @tornado.web.authenticated
    def post(self):
        args = self.json_args
        operator_id = self.current_user['id']
        opt = args.get('opt')
        id = args.get('id')
        cur_time = datetime.datetime.now()

        # 校验授权
        flag = self.master.get('auth:%s:%s' % (operator_id, 'approve'))
        if not flag:
            self.finish(json.dumps({'status': 'fail', 'msg': '授权失败'}))
            return

        session = self.session('purus')

        try:
            # 获取加款申请
            q = session.query(Deposit).filter(Deposit.id == id).one()

            status = q.status
            result = q.result
            amount = q.amount
            deposit_id = q.user_id

            if status == 'reject' or status == 'pass' or result:
                self.finish(json.dumps({'status': 'fail', 'msg': '对不起,这笔申请已处理过了'}))
                return

            # 拒绝加款
            if opt == 'reject':
                q.status = opt
                q.update_time = cur_time
                q.operator_id = operator_id
                session.commit()
                self.finish(json.dumps({'status': 'success', 'msg': '操作成功'}))
                return

            # 获取客服限额
            c = session.query(DepositQuota).filter(DepositQuota.operator_id == operator_id) \
                .order_by(desc(DepositQuota.id)).first()
            cs_value = c.value - amount

            if cs_value < 0:
                self.finish(json.dumps({'status': 'fail', 'msg': '余额不足'}))
                return

            # 调用加款接口
            income = str(amount / 10000)
            for i in range(3):
                result = yield self.post_fund('deposit', '', deposit_id, income)
                request_log.info('POST_FUND %s', result)
                if result in ['ok', 'unknown']:
                    break

            # 修改deposit result
            q.status = opt
            q.result = result
            q.update_time = cur_time
            # 增加deposit_quota 记录
            dep_quota = DepositQuota(operator_id=operator_id, type='deposit', amount=amount,
                                     value=cs_value, deposit_id=deposit_id, create_time=cur_time)
            session.add(dep_quota)
            session.commit()

            if result == 'ok':
                self.finish(json.dumps({'status': 'success', 'msg': '操作成功'}))
            else:
                self.finish(json.dumps({'status': 'fail', 'msg': '操作出现异常，请联系财务负责人'}))

        except Exception as e:
            request_log.exception('Handle deposit error')
            self.finish(json.dumps({'status': 'fail', 'msg': '内部错误'}))
            session.rollback()
        finally:
            session.close()
