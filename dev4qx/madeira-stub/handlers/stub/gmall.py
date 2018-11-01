import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class GmallOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("OutTradeNo")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = '<Response><Code>0</Code><Desc>success</Desc><TransIDO>201512171703801W8N6A</TransIDO><OutTradeNo>{0}</OutTradeNo><SuccessCount>1</SuccessCount><FailCount>0</FailCount><ErrorMobiles>[]</ErrorMobiles></Response>'.format(
                order_id)
            self.finish(json.dumps(data))
            if r1 == '0':
                IOLoop.current().call_later(10, gmall_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def gmall_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = '<?xml version="1.0" encoding="UTF-8"?>\n<FlowReport><data><transIDO>201512171703801W8N6A</transIDO><outTradeNo>{0}</outTradeNo><phone>13966669051</phone><status>0</status><desc>[0]\xe5\x85\x85\xe5\x80\xbc\xe6\x88\x90\xe5\x8a\x9f</desc></data></FlowReport>'.format(order_id)

    url = 'http://localhost:8899/callback/gmall'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
