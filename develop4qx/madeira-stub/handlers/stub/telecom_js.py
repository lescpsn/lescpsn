import json
import logging

import tornado

import tornado.web

request_log = logging.getLogger("madeira.request")


# 江苏电信
class Telecom_jsOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        print("In-telecom")
        try:

            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]

            desc = '订购成功！'
            r1 = master_test.hget('result:' + order_id, 'result')  # r2=r1=‘0,0000;成功’
            if ',' in r1:
                r1, = r1.split(',')  # r1="0" r2="0000;成功"
            if ';' in r1:
                r1, desc = r1.split(';')  # r1="0" r2="0000;成功"

            data = {"TSR_SERIAL": "20018620160115113356515618", "TSR_RESULT": r1, "TSR_MSG": desc}
            data = json.dumps(data)
            self.finish(data)
        except Exception:
            request_log.exception('FAIL')
