import logging
import time

import tornado
from tornado.web import MissingArgumentError

from handlers import signature
from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackStandardHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        # check ip

        # parse input
        try:
            up_order_id = self.get_argument('orderid')
            order_id = self.get_argument('sporderid')
            user_id2 = self.get_argument('userid')
            submit_time = self.get_argument('merchantsubmittime')
            up_back_result = self.get_argument('resultno')
            sign = self.get_argument('sign')
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

            stage = self.restore_order(order_id)

            self.up_back_result = up_back_result

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None or 'key' not in user:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            q = 'userid=%s&orderid=%s&sporderid=%s&merchantsubmittime=%s&resultno=%s&key=%s' % (
                user_id2, up_order_id, order_id, submit_time, up_back_result, user['key'])
            sign2 = signature(q)

            if sign != sign2:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

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
        else:
            yield self.dispatch()
