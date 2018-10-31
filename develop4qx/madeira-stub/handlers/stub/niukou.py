import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class NiukouOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("OutTradeNo")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"HEADER":{"SEQNO":"Q2015101209294910063131","SECERTKEY":"713B242546AA7239A572AE1E2103A777","APPID":"QuXun","TIMESTAMP":"20151012092949276","VERSION":"V1.0"},"MSGBODY":{"CONTENT":{"ORDERID":"144461347935975","EXTORDER":order_id},"RESP":{"RCODE":"00","RMSG":"OK"}}}
            self.finish(json.dumps(data))
            if r1 == '0':
                IOLoop.current().call_later(10, niukou_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def niukou_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = {"HEADER":{"VERSION":"V1.1","TIMESTAMP":'',"SEQNO":'',"APPID":"QuXun","SECERTKEY":"E4CF8702097BF3D3EFF03DF3ACFDEE5E"},"MSGBODY":{"CONTENT":{"ORDERID":"144461587745723","EXTORDER":order_id,"STATUS":"\u6210\u529f","CODE":"0"}}}

    body = json.dumps(body)
    url = 'http://localhost:8899/callback/niukou'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
