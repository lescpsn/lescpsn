import json
import logging
import time

import tornado
from tornado.web import MissingArgumentError

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


# {"request_no":"201410212350459602","result_code":"00000"}
class Callback21CnHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        # check ip

        # parse input
        try:
            argument = json.loads(self.request.body.decode('utf8'))

            order_id = argument['request_no']
            self.up_back_result = argument['result_code']
        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        self.finish('1')

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

        # update order status
        try:
            # check sign
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
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        # downstream callback or route to next...
        if self.up_back_result == '00000':
            self.callback('1')
        else:
            yield self.dispatch()
