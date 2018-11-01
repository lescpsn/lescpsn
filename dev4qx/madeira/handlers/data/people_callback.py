# 尚通回馈结果
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackPeopleHandler(CoreHandler):
    @tornado.gen.coroutine
    def get(self):

        order_id = 'UNKNOWN'

        try:
            order_id = self.get_argument('user_order_id')
            status = self.get_argument('status')

            self.finish('succ')

            request_log.info('CALLBACK %s', self.request.uri, extra={'orderid': order_id})

            if order_id is None:
                raise RuntimeError('order_id is None %s' % order_id)

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            self.up_back_result = status
            if status == '1':
                self.back_result = '1'
            else:
                self.back_result = '9'

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
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
