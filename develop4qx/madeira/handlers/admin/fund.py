# -*- coding: utf8 -*-

import json
import logging
import re
import time

import onetimepass as otp

from handlers import BaseHandler, signature


logger = logging.getLogger("madeira.request")
finance_log = logging.getLogger("madeira.finance")


def to_int(s_value):
    m = re.search('(\d*)(\.(\d{1,4}))?', s_value)
    v = int(m.group(1)) * 10000
    if m.lastindex == 2:
        x = m.group(3)
        v += int(x + '0' * (4 - len(x)))

    return v


class FundHandler(BaseHandler):
    def fail(self, msg):
        body = json.dumps({'status': 'fail', 'msg': msg})
        self.finish(body)

    def success(self, msg):
        body = json.dumps({'status': 'ok', 'msg': msg})
        self.finish(body)

    def post(self):
        cfg = self.application.config

        try:
            json_args = json.loads(self.request.body.decode('utf8'))

            _type = json_args['type']
            user_id = json_args['user_id']
            operator = json_args['operator']
            token = json_args['token']
            income0 = json_args['income']
            notes = json_args['notes']
            sign0 = json_args['sign']
            order_id = json_args['order_id']

        except Exception as e:
            return self.fail('参数输入错误')

        income = to_int(income0)
        outcome = 0

        if _type not in ['deposit', 'refund-manual', 'debit-manual']:
            return self.fail('财务类型异常')

        if operator not in cfg['operator']:
            return self.fail('无效用户')

        if _type == 'deposit' and (income > 10000000000 or income <= 0):
            return self.fail('一次性加款额度不得超过1,000,000元')

        if _type == 'refund-manual' and income > 5000000:
            return self.fail('订单退款额度异常')

        if _type == 'debit-manual':
            outcome = income
            income = 0

        operator_info = cfg['operator'][operator]
        secret = operator_info['secret']

        if not otp.valid_totp(token, secret, window=1):
            return self.fail('验证码失效')

        sign1 = signature('{user_id}{order_id}{income}{operator}{token}'.format(
            user_id=user_id,
            order_id=order_id,
            income=income0,
            operator=operator,
            token=token))

        if sign1 != sign0:
            return self.fail('安全签名错误！')

        sign2 = signature('{user_id}{order_id}{income}{operator}{token}{secret}'.format(
            user_id=user_id,
            order_id=order_id,
            income=income0,
            operator=operator,
            token=token,
            secret=secret))

        # redis
        try:
            k = 'point:%s' % user_id
            balance = self.master.incrby(k, income - outcome)

            finance_log.info('%s user=%s, value=%d, balance=%d',
                             _type.upper(), user_id, income, balance, extra={'orderid': order_id})
        except Exception as e:
            finance_log.info('%s ERROR user=%s, value=%d, balance=%d',
                             _type.upper(), user_id, income, balance, extra={'orderid': order_id})
            return self.fail('内部错误！' + str(e))

        # type|income|outcome|balance|order_id|user_id|account|name|t|operator|sign|notes
        finance = '{type}|{income}|{outcome}|{balance}|{order_id}|{user_id}|||{time}|{operator}|{sign}|{notes}'.format(
            type=_type,
            income=income,
            outcome=outcome,
            balance=balance,
            order_id=order_id,
            user_id=user_id,
            time=time.mktime(time.localtime()),
            operator=operator,
            sign=sign2,
            notes=notes)
        try:
            self.master.lpush('finance', finance)
            finance_log.info('FINANCE ' + finance, extra={'orderid': order_id})
        except Exception as e:
            finance_log.info('FINANCE ERROR' + finance, extra={'orderid': order_id})
            return self.fail('内部错误！' + str(e))

        return self.success(str(balance))


if __name__ == '__main__':
    print(to_int('1'))
    print(to_int('1.2'))
    print(to_int('1.02'))
    print(to_int('1.020'))
    print(to_int('1.0203'))
    print(to_int('1.02034'))