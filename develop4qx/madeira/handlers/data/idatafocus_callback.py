# 流量星回馈结果
import logging
import re
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': '1',  # 充值请求提交成功,
    '-1': '9',  #用户名或密码错误,
    '-2': '9',  #参数错误,
    '-3': '9',  #充值体格式错误,
    '-4': '9',  #IP不对,
    '-5': '9',  #系统异常,
    '-6': '9',  #已超过本月最大充值额度,
    '-7': '9',  #额度不足,
    '-8': '9',  #用户被锁定,
    '-9': '9',  #流量包错误,
    '-10': '9',  #手机号码错误,
}


class CallbackIdatafocusHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode('utf-8')

        callback_order = ''.join(body.split())
        try:
            order_id = re.search(r'<orderid>(.*)</orderid>', callback_order).groups()[0]

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = re.search(r'<rechargeStatus>(.*)</rechargeStatus>', callback_order).groups()[0]

            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status, '9')

            if self.back_result is None:
                request_log.error('INVALID STATUS %s', status, extra={'orderid': order_id})
                return

            master = self.master

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        self.finish("success")

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
