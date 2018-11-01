import json
import logging
from tornado.httpclient import AsyncHTTPClient, HTTPError
import xml.etree.ElementTree as ET
import time
import tornado.gen

from handlers.core import CoreHandler
from handlers import signature

request_log = logging.getLogger("madeira.request")

QUERY_MAPPING = {
    0: 0,
    1: 1,
    2: 0,
    5: 0,
    -2: 9,
}

RESULT_MAP = {
    '0':'9',
    '1':'1'
}

class CallbackMopoteHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):

        master = self.master

        order_id = None

        try:
            body = self.request.body.decode()
            obj = json.loads(body)

            order_id = obj.get('channelOrderId')
            status = obj.get('status')

            request_log.info('MOPOTE BACK %s', body, extra={'orderid': order_id})
            self.finish('{"status": 1}')

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            # 最终充值结果。0表示失败、1表示成功
            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status)

            if self.back_result is None:
                request_log.error('INVALID STATUS %s', status, extra={'orderid': order_id})
                return

            stage = self.restore_order(order_id)

            # checking callback
            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: status,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.exception('restore order info error %s', self.request.body, extra={'orderid': order_id})
            self.send_error(500)
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
