import logging
import time

import tornado
from tornado.web import MissingArgumentError

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': '0',  # 提交成功
    '1': '0',  # 充值中
    '2': '1',  # 充值成功
    '3': '9',  # 充值失败
    '4': '0',  # 部分到账
}


class CallbackJiebeiHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        # check ip

        # parse input
        try:
            userid = self.get_body_argument("userid")
            order_id = self.get_body_argument("orderid")
            up_order_id = self.get_body_argument("tranid")
            resultno = self.get_body_argument("resultno")
            vstr = self.get_body_argument("vstr")

            up_back_result = RESULT_MAP.get(resultno, '0')

        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return
        # check input

        self.finish("ok")

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

        # update order status
        try:
            # check sign
            master = self.master

            order_info = master.hmget('order:' + order_id, [
                'user_id',  # 0
                'value',  # 1
                'stage',  # 2
                'area',  # 3
                'price',  # 4
                'back_url',  # 5
                'sp_order_id',  # 6
                'mobile',  # 7
                'price',  # 8
                'product',  # 9
                'plat_offer_id'  # 10
            ])

            self.order_id = order_id

            self.user_id = order_info[0]
            self.value = int(order_info[1])
            stage = int(order_info[2])

            area = order_info[3]
            self.carrier, self.area = area.split(':')
            self.price = order_info[4]
            self.back_url = order_info[5]

            self.sp_order_id = order_info[6]
            self.mobile = order_info[7]
            self.price = order_info[8]
            self.product = order_info[9]
            self.plat_offer_id = order_info[10]

            self.route = master.hget('order:' + order_id, 'route/%d' % stage)
            self.up_order_id = up_order_id
            self.up_back_result = up_back_result

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None or 'key' not in user:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_order_id/%d' % stage: up_order_id,
                'up_back_result/%d' % stage: up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })
        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        # downstream callback or route to next...
        if up_back_result == '1':
            self.callback('1')
        elif up_back_result == '9':
            yield self.dispatch()
        else:
            pass  # TODO: logging & waiting for human
