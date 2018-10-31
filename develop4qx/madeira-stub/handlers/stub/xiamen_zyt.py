import base64
import codecs
import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from Crypto.Cipher import AES

request_log = logging.getLogger("madeira.request")


class XiamenZytOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            order_id = self.get_argument("orderno")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="100" r2="00;成功"

            self.finish(json.dumps({'resultcode': r1}))
            if r1 == '0':
                IOLoop.current().call_later(10, xiamen_zyt_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def xiamen_zyt_callback(order_id, result):
    if ';' in result:
        result = result.split(';')[0]

    body = json.dumps({
        "channelNo": "yiqichong001",
        "orderno": order_id,
        "responsetime": "20160116073449",
        "resultcode": result
    })

    http_client = AsyncHTTPClient()

    try:
        request_log.info('XIAMEN_ZYT CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/xiamen_zyt', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
