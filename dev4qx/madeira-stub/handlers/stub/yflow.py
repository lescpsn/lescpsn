import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class YflowOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("seqNo")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            data = {"allocateId": 3144838, "retCode": 0, "retMsg": "\u53d7\u7406\u6210\u529f"}
            self.finish(json.dumps(data))
            if r1 == '0':
                IOLoop.current().call_later(10, yflow_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def yflow_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = 'code=0&allocateId=3144838&allocateTime=20151229152000&seqNo={0&mobile=18687033208'.format(order_id)
    url = 'http://localhost:8899/callback/yflow' + '?' + body

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='GET')
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
