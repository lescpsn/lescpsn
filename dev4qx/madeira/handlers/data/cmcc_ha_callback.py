# 河南移动回馈结果

import logging
import time
import json
import tornado
import tornado.gen

from handlers.core import CoreHandler
from handlers.data.cmcc_ha import expire

request_log = logging.getLogger("madeira.request")


class CallbackCmcchaHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode()
        self.finish('{"respCode":"00000","respDesc":"success"}')

        try:
            master = self.master

            callback_order = json.loads(body)
            jd_json_paras = callback_order['jd_json_paras']
            callback_order = json.loads(jd_json_paras)

            order_id = callback_order["result"]['CUST_ORDER_ID']
            up_back_result = callback_order["result"]['DEAL_RESULT']

            request_log.info('CALLBACK %s - %s' % (self.request.uri, body), extra={'orderid': order_id})

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            if up_back_result == 'Y':
                self.up_back_result = "1"
            elif up_back_result == 'N':
                self.up_back_result = "9"

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

            processing = master.get('hacmcc:user:%s' % self.mobile)
            if processing == 'processing':
                if self.up_back_result == '1':
                    master.setex('hacmcc:user:%s' % self.mobile, expire(), time.strftime("%Y%m", time.localtime()))
                else:
                    master.delete('hacmcc:user:%s' % self.mobile)

        except Exception as e:
            request_log.exception('RESTORE ORDER INFO ERROR %s', body, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
