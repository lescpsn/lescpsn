# 极猫回馈结果
import logging
import time
import xml.etree.ElementTree as ET

import tornado
import tornado.gen

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")


class CallbackGmallHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode('utf-8')

        try:
            root = ET.fromstring(body)
            order_id = root.find('data/outTradeNo').text

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = root.find('data/status').text
            if status == '0':
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

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        self.finish("success")

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
