# encoding: utf8
import hashlib
import tornado
import tornado.gen
import tornado.ioloop
from tornado.httpclient import AsyncHTTPClient

io_loop = tornado.ioloop.IOLoop.current()
http_client = AsyncHTTPClient()


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode())
    return m.hexdigest().upper()


@tornado.gen.coroutine
def test_pricing():
    try:
        tsp0 = '111111'
        encrypted = signature(tsp0 + 'hsauZAuMg76Wr6re')

        url = 'http://localhost:8899/admin/pricing'
        body = 'incrby upstream:xicheng 8800000'

        h = {'tsp': tsp0, 'v': encrypted}

        response = yield http_client.fetch(url, method='POST', body=body, headers=h)
        body = response.body.decode()
    finally:
        http_client.close()
        io_loop.stop()


if __name__ == '__main__':
    io_loop.add_callback(test_pricing)
    io_loop.start()
