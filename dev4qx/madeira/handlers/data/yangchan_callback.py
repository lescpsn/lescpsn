import logging
import time

import tornado

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    '0': '00000',
    '-1': '90003'
}


class CallbackYangchanHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        # verification=6ff4ead232550ea04633316c07eb70f1&code=0&order_id=Q2014121215361210000297&info=&
        order_id = 'UNKNOWN'

        # check ip
        try:
            args = {}
            body = self.request.body.decode('gbk')

            for kv in body.split('&'):
                if '=' in kv:
                    k, v = kv.split('=')
                    args[k] = v

            order_id = args['order_id']
            code = args['code']
            verification = args['verification']

            self.up_back_result = RESULT_MAPPING.get(code, code)
        except KeyError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            return self.finish()

        self.finish('<?xml version="1.0" encoding="utf-8" ?><result><code>0</code><info/></result>')

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
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })
        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        # downstream callback or route to next...
        if self.up_back_result == '00000':
            self.callback('1')
        elif self.up_back_result == '90003':
            yield self.dispatch()
        else:
            request_log.error('INVALID RESULT %s', self.up_back_result, extra={'orderid': order_id})
