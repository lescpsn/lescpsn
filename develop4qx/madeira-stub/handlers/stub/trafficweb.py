import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")


class TrafficwebOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("request_no")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"request_no": order_id, "orderstatus": "processing", "result_code": "00000",
                    "result_desc": "\u7b49\u5f85\u5904\u7406"}
            self.finish(json.dumps(data))
            if r1 == '00000':
                IOLoop.current().call_later(10, trafficweb_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def trafficweb_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    data = {"partner_no": "100068", "orderstatus": "finish", "result_code": result, "phone_id": "15968883891",
            "ordertime": "", "facevalue": "14", "realvalue": "14", "order_id": order_id, "plat_offer_id": "ZJHX.200M",
            "transactionid": "2016-01-25 17:07:01", "result_desc": "\\u5145\\u503c\\u6210\\u529f\\uff0csuccess"}

    body = json.dumps(data)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('TRAFFICWEB CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/trafficweb', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
