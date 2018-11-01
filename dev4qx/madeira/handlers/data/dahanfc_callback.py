# coding=utf8
import json
import logging
import time

import tornado

from handlers.core import CoreHandler
from handlers.data.aspire import AspireBase

request_log = logging.getLogger("madeira.request")


class CallbackDahanfcHandler(CoreHandler, AspireBase):
    @tornado.gen.coroutine
    def post(self):
        request_body = self.request.body
        request_info = json.loads(request_body.decode())

        self.finish(json.dumps({"resultCode": "0000", "resultMsg": "处理成功！"}))

        order_id = 'UNKNOWN'

        try:
            order_id = request_info['clientOrderId']
            result_status = str(request_info.get('status'))
            result_errcode = str(request_info.get('errorCode'))
            master = self.master

            request_log.info('CALLBACK %s - %s' % (self.request.uri, request_info), extra={'orderid': order_id})

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]

            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            if result_status == '0':
                self.up_back_result = '1'
                result = result_status
            else:
                self.up_back_result = '9'  # TODO: result mapping
                result = result_errcode

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body),
                             extra={'orderid': order_id})
            request_log.exception('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
