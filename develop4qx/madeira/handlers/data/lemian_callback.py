#乐免回调结果
import json
import logging
import time
import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackLemianHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'
        body = self.request.body.decode()
        self.finish("1")
        callback_order = json.loads(body)
        callback_order = callback_order[0]

        try:
            sp_order_id = callback_order.get("msgid")
            order_id = self.master.get('map:lemian:{sp_order_id}'.format(sp_order_id=sp_order_id))
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            if order_id is None:
                raise RuntimeError('order_id is None %s' % sp_order_id)

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order.get("status")
            self.up_back_result = status
            if status == '00000':
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

            self.master.delete('map:lemian:{orderID}'.format(orderID=sp_order_id))

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()


