import json
import logging
from urllib.parse import urlencode

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")


# 流量星
class IDataFocusOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        try:
            body = self.get_argument("body")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"code": r1, "tip": "执行成功"}
            data = json.dumps(data)
            self.finish(data)  # 返回下游报文

            if r1 == '100':
                IOLoop.current().call_later(10, ibumobile_callback, order_id, r2)
        except Exception:
            request_log.exception('FAIL')


def ibumobile_callback(order_id, result):
    desc = ''
    if ';' in result:
        result, desc = result.split(';')

    body = {
        "orderNo": order_id,
        "resCode": result,
        "redMsg": desc,
    }
    body = urlencode(body)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('IBUMOBILE CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/ibumobile', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
