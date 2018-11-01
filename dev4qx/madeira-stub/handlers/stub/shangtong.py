import json
import logging

import time
import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")


class ShangtongOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        print("******************shangtong in")
        try:
            # order_id = self.get_argument("order_id")

            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="0000" r2="0000;成功"

            up_order_id = str(int(time.time()))
            if r1 == '0000':
                data = {"respCode": r1, "message": "\u6210\u529f", "orderID": up_order_id}
            else:
                data = {"respCode": r1, "message": "\u6210\u529f"}

            self.finish(json.dumps(data))

            if r1 == '0000':
                IOLoop.current().call_later(10, shangtong_callback, up_order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def shangtong_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = {"respCode": result, "respMsg": "\u5145\u503c\u6210\u529f", "orderID": order_id,
            "message": "\xe6\x88\x90\xe5\x8a\x9f", "phoneNo": "13218699369"}

    body = json.dumps(body)
    url = 'http://localhost:8899/callback/shangtong'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
