# 信之源回馈结果
import logging
import time
import json

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackZhjxzyHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            body = self.request.body.decode()
            orders = json.loads(body)
            self.finish('0')

            request_log.exception('ZHJXZY %s', body, extra={'orderid': 'UNKNOWN'})

            for callback_order in orders:
                handler = ZhjxzySingleHandler(self.application, self.request)
                yield handler.by_order(callback_order)

        except:
            request_log.exception('FAIL ZHJXZY', extra={'orderid': 'UNKNOWN'})
            # self.finish()


class ZhjxzySingleHandler(CoreHandler):
    @tornado.gen.coroutine
    def by_order(self, callback_order):
        order_id = 'UNKNOWN'

        # body = self.request.body.decode('utf-8')
        # callback_order = json.loads(body)[0]

        try:
            up_order_id = callback_order["id"]

            order_id = self.master.get('map:xzy:%s' % up_order_id)
            if order_id is None:
                request_log.error('XZY UP_ORDER CANNOT MAPBACK', extra={'orderid': up_order_id})
                return

            request_log.info('CALLBACK %s %s' % (self.request.uri, json.dumps(callback_order)),
                             extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = str(callback_order.get("reportStatus"))

            if status == '1':
                self.up_back_result = "1"
            else:
                self.up_back_result = "9"

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

            master.expire('map:xzy:%s' % up_order_id, 3600)

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
