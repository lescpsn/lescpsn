import json
import logging
import time
import hashlib

from Crypto.Cipher import AES
import tornado
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


def unpad(s):
    return s[0:-ord(s[-1])]


def unhexlify(s):
    """
    ord('a')=>97
    """
    b = bytearray(len(s) // 2)

    for i in range(int(len(s) / 2)):
        print((ord(s[i * 2]) - 97))
        print(ord(s[i * 2 + 1]) - 97)
        x = ((ord(s[i * 2]) - 97) * 16 + (ord(s[i * 2 + 1]) - 97))

        b[i] = x

    return bytes(b)


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode('utf8'))
    return m.hexdigest().upper()


class TwentyFirstOrderHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(TwentyFirstOrderHandler, self).__init__(application, request)
        self.req_time = time.localtime()
        self.request_no = None

    def finish_with_result(self, result):
        body = json.dumps({'result_code': result, 'request_no': self.request_no})

        self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
        self.finish(body)
        print('RESPONSE - %s' % body)

    @tornado.gen.coroutine
    def post(self):
        print('REQUEST - %s' % self.request.body)

        try:
            url = self.request.host

            body = json.loads(self.request.body.decode())
            code = body['code']
            code_bytes = unhexlify(code)  # bytes

            aes = AES.new('ZIadZudsXQEixvkB', AES.MODE_CBC, '4721122171573958')
            encrypted = aes.decrypt(code_bytes)
            code = unpad(encrypted.decode('utf8'))

            args = json.loads(code)

            self.request_no = args['request_no']

        except Exception as e:
            print(e)
            pass

        slave1 = self.application.sentinel.slave_for('madeira', db=1)
        master3 = self.application.sentinel.master_for('madeira', db=3)

        stub_order_id = slave1.hget('order:%s' % self.request_no, 'sp_order_id')
        key = 'order:%s' % stub_order_id
        r1 = master3.hget(key, 'r1') or '00000'
        r2 = master3.hget(key, 'r2') or '00000'

        if r1 == '0':
            IOLoop.current().call_later(10, test_callback, self.request_no, r2)
            self.finish_with_result('00000')
        else:
            self.finish_with_result(r1)

        # CHECK-POINT 1
        order_info = slave1.hgetall('order:%s' % self.request_no)
        for key in order_info:
            request_log.info('[%s]=>[%s]', key, order_info[key])


def test_callback(request_no, result):
    body = json.dumps({'request_no': request_no, 'result_code': result})

    print('CALLBACK - %s' % body)

    http_client = AsyncHTTPClient()
    try:
        http_client.fetch('http://localhost:8899/data/callback', method='POST', body=body)
    except Exception as e:
        print(e)
    finally:
        http_client.close()
