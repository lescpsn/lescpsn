# 未来无限回馈结果
import json
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")


class CallbackRuanyunbiHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        master = self.master
        order_id = 'UNKNOWN'

        try:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            request_body = json.loads(str(self.request.body, encoding='utf-8'))

            order_id = request_body["transno"]

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = request_body["ordercode"]
            request_log.info('GET UP_BACK STATUS-{0}'.format(status), extra={'orderid': order_id})

            if status == '100':
                self.up_back_result = "1"
            else:
                self.up_back_result = "9"

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

        self.finish('success')

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
