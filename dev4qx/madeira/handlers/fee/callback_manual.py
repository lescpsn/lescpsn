# -*-coding: utf-8 -*-
import base64
import json
import logging
import time

import tornado
from Crypto.Cipher import AES
from tornado.web import MissingArgumentError

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


# userid=100001
# orderid=Q2014091214101800000036
# sporderid=20140910155355157
# merchantsubmittime=20140910155357
# resultno=5003
# sign=843C3CB9A2CE1C937B456B768F2F9F4C
#
def unpad(s):
    return s[0:-ord(s[-1])]


class CallbackManualHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):

        order_id = 'UNKNOWN'

        try:
            b = self.request.body.decode()
            args = json.loads(b)
            user_id = args['user_id']
            code = args['code']

            # 解密aes
            code = base64.b64decode(code)

            key = self.application.config['downstream'][user_id]['pass']
            iv = self.application.config['downstream'][user_id]['iv']

            chiper = AES.new(key, AES.MODE_CBC, iv)
            encrypted = chiper.decrypt(code)
            code = unpad(encrypted.decode('utf8'))

            order = json.loads(code)

            order_id = order.get('order_id')
            up_back_result = order.get('result_code')

        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        if not self.master.sismember('list:create', order_id):
            request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
            self.finish('fail')
            return

        # check input
        self.finish("success")

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

        # update order status

        try:
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
            self.up_back_result = up_back_result

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
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
