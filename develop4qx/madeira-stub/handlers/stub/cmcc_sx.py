#山西移动stub接口
import json
import logging
import tornado
import tornado.web

request_log = logging.getLogger("madeira.request")


class Cmcc_sxOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        try:

            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]

            r1 = master_test.hget('result:' + order_id, 'result')
            if ',' in r1:
                r1, r2 = r1.split(',')
            if r1 == '0000000':
                data = {"resCode": r1, "resMsg": "ok", "orderId": order_id}
            else:
                data = {"resCode": r1, "resMsg": "ok"}

            self.finish(json.dumps(data))

        except Exception:
            request_log.exception('FALL')








