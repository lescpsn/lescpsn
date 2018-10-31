import logging
import time
import xml.etree.ElementTree as ET

import tornado
from tornado.httpclient import AsyncHTTPClient
from tornado.web import MissingArgumentError

from handlers import signature, BaseHandler
from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

# 0表示排队中，1表示充值中、2表示充值成功、3表示失败、5表示退款状态、6退款成功，7部分退款
RESULT_MAP = {
    '0': '0',
    '1': '0',
    '2': '1',
    '3': '9',
    '5': '9',
    '6': '9',
    '7': '9',
}


# R10_trxDate=20160309123720&
# R0_biztype=mobiletopup&
# R1_agentcode=JFCS201601191438&
# R7_trxid=JFTS10000000742&
# R3_parvalue=100&hmac=7af7d7ff38a3e7e8276bfea5e6db865b&
# R6_requestid=Q2016030912402810000465&
# R9_extendinfo=&
# R5_productcode=SHKC&
# R4_trxamount=99.89&
# R2_mobile=13951771065&
# R8_returncode=6
class CallbackJinfengHandler(CoreHandler):
    @tornado.gen.coroutine
    def get(self):
        order_id = 'UNKNOWN'

        # check ip

        # parse input
        try:
            up_order_id = self.get_argument('R7_trxid')
            order_id = self.get_argument('R6_requestid')
            return_code = self.get_argument('R8_returncode')
            # sign = self.get_argument('sign')

            up_back_result = RESULT_MAP.get(return_code, '0')

        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        # check input
        self.write("success")
        self.finish()

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
