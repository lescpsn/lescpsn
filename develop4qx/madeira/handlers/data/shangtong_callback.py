# 尚通回馈结果
import json
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': '0',  # 下单成功
    '0001': '0',  # 充值中
    '0002': '1',  # 充值成功
    '0003': '9',  # 充值失败
    '1000': '9',  # 用户不存在
    '1001': '9',  # IP 鉴权失败
    '1002': '9',  # 签名校验失败
    '1003': '9',  # 该订单不存在
    '1004': '9',  # 您无权查看别人的订单状态
    '8000': '9',  # 其他错误。请联系工程师跟进。
}


class CallbackShangtongHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode()
        self.finish('Success')
        callback_order = json.loads(body)

        try:
            sp_order_id = callback_order["orderID"]
            order_id = self.master.get('map:shangtong:{sp_order_id}'.format(sp_order_id=sp_order_id))

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            if order_id is None:
                raise RuntimeError('order_id is None %s' % sp_order_id)

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order["respCode"]
            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status, "9")
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

            self.master.delete('map:shangtong:{orderID}'.format(orderID=sp_order_id))

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
