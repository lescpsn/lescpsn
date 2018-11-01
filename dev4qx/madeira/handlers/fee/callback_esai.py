import logging
import time
import xml.etree.ElementTree as ET

import tornado
from tornado.httpclient import AsyncHTTPClient
from tornado.web import MissingArgumentError

from handlers import signature, BaseHandler
from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackESaiHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        # check ip
        # UserNumber=9000215&InOrderNumber=IP9000215201506251622000184&OutOrderNumber=Q2015062516220010000184&PayResult=5&CustomInfo=--&RecordKey=2189E9266575527D&OrderType=P
        # parse input
        try:
            user_number = self.get_argument('UserNumber')
            up_order_id = self.get_argument('InOrderNumber')  # 0=success,1=fail
            order_id = self.get_argument('OutOrderNumber')  # 0=success,1=fail
            pay_result = self.get_argument('PayResult')
            custom_info = self.get_argument('CustomInfo')

            sign = self.get_argument('RecordKey')

            # result mapping
            if pay_result == '4':
                up_back_result = '1'
            elif pay_result == '5':
                up_back_result = '9'
            else:
                up_back_result = '9999'

        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        # check input
        self.finish('<?xml version="1.0" encoding="GB2312"?><root><result>success</result></root>')

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

        # update order status
        try:
            # check sign
            master = self.master

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

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
            self.up_back_result = up_back_result

            # checking callback
            user = self.application.config['upstream'].get(self.route)
            if user is None or 'key' not in user:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            key = user['key']
            sign2 = signature(user_number, up_order_id, order_id, pay_result, custom_info, key)

            if sign != sign2[0:16]:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.exception('restore order info error %s', e, extra={'orderid': order_id})
            return

        # downstream callback or route to next...
        if up_back_result == '1':
            self.callback('1')
        elif up_back_result == '9':
            yield self.dispatch()
        else:
            pass  # TODO: logging & waiting for human
