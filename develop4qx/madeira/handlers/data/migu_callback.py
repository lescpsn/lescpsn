# coding=utf8
import logging
import time

import tornado

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackMiguHandler(CoreHandler):
    @tornado.gen.coroutine
    def get(self):
        self.finish('ok')

        order_id = None
        try:
            master = self.master

            orderform = self.get_argument('orderform')
            order_id = master.get('map:migu:%s' % orderform)

            if order_id is None:
                raise RuntimeError('order_id is None')
            else:
                request_log.info('CALLBACK %s' % (self.request.uri), extra={'orderid': order_id})

            result_code = self.get_argument('code')
            if result_code == '0':
                self.up_back_result = '1'
            else:
                self.up_back_result = '9'

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

            master.delete('map:migu:%s' % orderform)

        except Exception as e:
            request_log.error('CALLBACK %s' % (self.request.uri),
                              extra={'orderid': order_id})
            request_log.exception('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
