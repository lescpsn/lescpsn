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

AES_KEY = 'RtGpAPFoXiSY8BgDWz85V7GPPFJeWvoh'
AES_IV = "176543218'653#23"


def unpad(s):
    return s[0:-ord(s[-1])]


# 魔品
class MopotaOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            body = self.request.body.decode()
            body = codecs.decode(body, 'hex')
            aes = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
            encrypted = aes.decrypt(body)
            # code = unpad(encrypted.decode('utf8'))
            body = unpad(encrypted.decode())

            request_body = json.loads(body)
            order_id = request_body.get("channelOrderId")

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # r2=r1='0000,1;成功'

            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="0000" r2="1;成功"

            data = {
                "statusCode": 200,
                "data":
                    {
                        "orderId": "O160115150601086",
                        "channelOrderId": order_id,
                        "status": r1,
                        "failReason": "提交成功"
                    }
            }

            data = json.dumps(data)
            self.finish(data)

            if int(r1) == 0:
                IOLoop.current().call_later(10, mopota_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def mopota_callback(order_id, result):
    desc = ''
    if ';' in result:
        result, desc = result.split(';')

    body = {"orderId": order_id, "channelOrderId": order_id, "status": result, "failReason": desc}
    body = json.dumps(body)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('MOPOTA CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/mopote', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
