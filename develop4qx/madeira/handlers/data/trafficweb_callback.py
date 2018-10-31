# 乐流回馈结果
import json
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    "finish": "1",
    "fail": "9"
}


class CallbackTrafficwebHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode('utf-8')

        callback_order = json.loads(body)
        try:
            order_id = callback_order["order_id"]

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order["orderstatus"]

            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status)

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

        self.finish("1")

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
