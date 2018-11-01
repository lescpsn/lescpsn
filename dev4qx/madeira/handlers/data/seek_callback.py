import logging
import time

import tornado
from tornado.web import MissingArgumentError

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    '1000': '0'
}


class CallbackSeekHandler(CoreHandler):
    @tornado.gen.coroutine
    def get(self):
        # orderNo=1418200000100039&channelOrderNo=Q2014121016263700050220&orderStatus=4&resultCode=1000&resultReason=OK
        order_id = 'UNKNOWN'
        status = 5

        # check ip
        try:
            up_order_id = self.get_argument('orderNo')
            order_id = self.get_argument('channelOrderNo')
            status = self.get_argument('orderStatus')
            up_back_result = self.get_argument('resultCode')
        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        self.finish('SUCCESS')

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

        # update order status
        try:
            # check sign
            master = self.master

            stage = self.restore_order(order_id)

            # checking callback
            upstream = self.application.config['upstream'][self.route]
            if upstream is None:
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

        # result mapping
        self.up_back_result = RESULT_MAPPING.get(up_back_result, up_back_result)

        # downstream callback or route to next...
        if status == '4':
            self.callback('1')
        elif status == '5':
            yield self.dispatch()
        else:
            request_log.error('INVALID STATUS %s', status, extra={'orderid': order_id})
