import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class XiaowoOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("reqordernum")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"returncode": "0000", "message": "\u6210\u529f", "datenum": "20151012113941989950"}
            self.finish(json.dumps(data))
            if r1 == '0':
                IOLoop.current().call_later(10, xiaowo_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def xiaowo_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = {
        "header": {"key": "FlowBack", "resTime": "20151012114023", "reqSeq": order_id, "channel": "1",
                   "version": "1.0", "sign": "304379ae3e40231ab5cea377bb2a5016"},
        "body": {"returncode": "0000", "phonenumber": "18626411002", "pid": "G00020",
                 "message": "\xe6\x88\x90\xe5\x8a\x9f",
                 "datenum": "20151012113941989950"}}

    body = json.dumps(body)
    url = 'http://localhost:8899/callback/xiaowo'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
