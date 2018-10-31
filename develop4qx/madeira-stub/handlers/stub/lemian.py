import json
import logging

import time
import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class LemianOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        try:
            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]
            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="1" r2="00000;成功"
            order_id = str(int(time.time()))
            if r1 == '1':
                data = {"status": r1, "description": "\u6210\u529f", "msgid": order_id}
            else:
                data = {"status": r1, "description": "\u6210\u529f"}

            self.finish(json.dumps(data))

            if r1 == '1':
                IOLoop.current().call_later(2, lemian_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def lemian_callback(order_id, result):

    if ';' in result:
        result = result.split(';')[0]

    body = [{"status": result, "respMsg": "\u5145\u503c\u6210\u529f", "msgid": order_id, "time": int(time.time()), "mobile": "13218699369"}]

    body = json.dumps(body)
    url = 'http://localhost:8899/callback/lemian'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)

    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
