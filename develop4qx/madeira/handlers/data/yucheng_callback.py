# encoding=utf8
# 裕诚新接口回馈结果
import json
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '1': '1',  # 成功
    '0': '0',  # 处理中
    '2': '9',  # 失败
}


class CallbackYuchengHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode()
        callback_order = json.loads(body)

        try:
            order_id = callback_order["paralist"]["orderid"]

            # dual callback workaround
            if self.master.get('fix:yucheng:' + order_id):
                raise RuntimeError('YUCHENG dual callback')
            self.master.setex('fix:yucheng:' + order_id, 600, '1')
            # dual callback workaround end

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            if order_id is None:
                raise RuntimeError('YUCHENG order_id is None')

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order["paralist"]["resultcode"]
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
            request_log.exception('YUCHENG RESTORE ORDER ERROR', extra={'orderid': order_id})
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
