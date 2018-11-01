# 索派回馈结果
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '1': '1',  # 成功
    '0': '9',  # 失败
    '2': '9',  # 充值中
    '4': '9',  # 待处理
}


class CallbackSuopaiHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'
        self.finish('Success')

        try:
            sp_order_id = self.get_argument('jobId')
            order_id = self.master.get('map:suopai:{sp_order_id}'.format(sp_order_id=sp_order_id))

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            if order_id is None:
                raise RuntimeError('order_id is None %s' % sp_order_id)

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = self.get_argument("status")
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

            self.master.delete('map:suopai:{orderID}'.format(orderID=sp_order_id))

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
