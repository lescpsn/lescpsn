# 广州电信回馈结果
import json
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': '1',  # 成功
    '-1': '9',  # 数据参数错误
}


def parse_args(body):
    args = {}
    body = body.decode()
    for kv in body.split('&'):
        key, value = kv.split('=')
        args[key] = value

    return args


class CallbackTelecomGzHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):

        order_id = 'UNKNOWN'

        try:
            args = parse_args(self.request.body)

            sessionId = args.get('sessionId')
            order_id = self.master.get('map:telecom_gz:{sessionId}'.format(sessionId=sessionId))
            status = args.get('orderStat')

            self.finish(json.dumps({"resultCode": 0, "sessionId": order_id, "resultDesc": 'ok'}))

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if order_id is None:
                raise RuntimeError('order_id is None %s' % order_id)

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status, "9")

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
