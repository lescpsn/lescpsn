import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class RaiyiOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("OutTradeNo")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"code": "0000", "msg": "\u63d0\u793a\uff1a\u64cd\u4f5c\u6210\u529f", "mustShow": 0, "msgTecent": '',
                    "data": {"orderNo": order_id}}
            self.finish(json.dumps(data))
            if r1 == '0':
                IOLoop.current().call_later(10, raiyi_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def raiyi_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = 'desc&orderNo=PO1352015120314113815907024&status=4&partnerOrderNo={0}'.format(order_id)
    url = 'http://localhost:8899/callback/raiyi'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
