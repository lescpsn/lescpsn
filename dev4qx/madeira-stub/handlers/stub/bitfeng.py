import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class BitfengOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("client_order_id")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"order_id":"2016012616283959352","client_order_id":order_id,"status":"E10000","desc":"\u8ba2\u5355\u63d0\u4ea4\u6210\u529f"}
            self.finish(json.dumps(data))
            if r1 == 'E10000':
                IOLoop.current().call_later(10, trafficweb_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def trafficweb_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    data = {"order_id":"2016012710232187985","client_order_id":order_id,"status":result, "desc":"\\u8ba2\\u8d2d\\u6210\\u529f"}
    body = json.dumps(data)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('TRAFFICWEB CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/bitefeng', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
