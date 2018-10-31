import json
import logging
from urllib.parse import urlencode

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")


# 中深源
class Faliuliang2OrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):

        try:
            body = self.request.body.decode()
            body = json.loads(body)
            order_id = body["tradeNo"]

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1=0 r2="s;成功"

            r1 = int(r1)
            data = {"ok": "true", "message": "", "object": [], "code": r1}
            data = json.dumps(data)
            self.finish(data)  # 返回下游报文

            if r1 == 0:
                IOLoop.current().call_later(10, faliuliang2_callback, order_id, r2)
        except Exception:
            request_log.exception('FAIL')


def faliuliang2_callback(order_id, result):
    desc = ''
    if ';' in result:
        result, desc = result.split(';')

    tradeNo = order_id
    mobile = ""
    ok = "true"
    signature = "signature"

    body = {
        "tradeNo": tradeNo,
        "mobile": mobile,
        "ok": ok,
        "result": result,
        "signature": signature,
    }
    body = urlencode(body)

    url = 'http://localhost:8899/callback/faliuliang2'
    url = url + "?" + body
    http_client = AsyncHTTPClient()

    try:
        request_log.info('TO FALIULIANG2 CALLBACK\n%s ', body)

        http_client.fetch(url, method='GET')
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
