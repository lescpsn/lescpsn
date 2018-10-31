# 中琛源回馈结果
import logging
import time
import tornado
import tornado.gen

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '00': '1',  # 成功
    '-99999': '9',  # 失败
}


class CallbackIbumobile2Handler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'
        self.finish("success")

        try:
            order_id = self.get_body_argument("orderNo")

            request_log.info('IBUMOBILE CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = self.get_body_argument("resCode")

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
            self.finish()
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()

