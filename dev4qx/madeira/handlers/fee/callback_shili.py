import logging
import time
import xml.etree.ElementTree as et

import tornado
from tornado.web import MissingArgumentError

from handlers import signature
from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    0: 1,  # 充值成功
    503: 9,  # 充值失败
}


class CallbackShiliHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        # check ip

        # parse input
        try:
            body = self.request.body.decode()
            root = et.fromstring(body)

            up_back_result = root.find('retcode').text
            up_order_id = root.find('oid_goodsorder').text
            order_id = root.find('jno_cli').text
            user_id = root.find('oid_reguser').text
            fill_time = root.find('fill_time').text
            up_cost = root.find('succ_amount').text
            sign = root.find('sign').text

        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        # check input
        self.finish('<?xml version="1.0" encoding="UTF-8"?><root><retcode>000000</retcode></root>')

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
            self.up_back_result = int(up_back_result)

            # checking callback
            up_stream = self.application.config['upstream'][self.route]
            if up_stream is None or 'key' not in up_stream or up_stream['user'] != user_id:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            # retcode; oid_reguser; jno_cli; oid_goodsorder; succ_amount; fill_time
            q = up_back_result + user_id + order_id + up_order_id + up_cost + fill_time + up_stream['key']
            sign2 = signature(q).lower()

            if sign != sign2:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time),
                'up_cost/%d' % stage: up_cost,
            })
        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        r = int(up_back_result)
        up_back_result = RESULT_MAPPING.get(r, r)

        # downstream callback or route to next...
        if up_back_result == 1:
            self.callback('1')
        elif up_back_result == 9:
            yield self.dispatch()
        else:
            request_log.info('UNKNOWN RESULT %s', up_back_result, extra={'orderid': order_id})
