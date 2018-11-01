import logging
import time
import datetime
import json
import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")


class CallbackNiukouHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        try:
            body = self.request.body.decode()
            callback_order = json.loads(body)

            order_id = callback_order["MSGBODY"]["CONTENT"]["EXTORDER"]

            request_log.info('CALLBACK %s - %s' % (self.request.uri, body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order["MSGBODY"]["CONTENT"]['CODE']
            if status in ['0', '00', '0000']:
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
                'up_back_result/%d' % stage: status,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        response_body = {
            "HEADER": {"VERSION": "V1.0", },
            "MSGBODY": {"RESP": {"RCODE": "00", "RMSG": "ok"}}
        }

        response_body = json.dumps(response_body)
        self.finish(response_body)

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
