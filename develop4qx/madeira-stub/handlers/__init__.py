import time

from tornado.ioloop import IOLoop

import tornado.web
import tornado.gen

__author__ = 'Kevin'


class EchoHandler(tornado.web.RequestHandler):
    def head(self):
        self.finish()

    def get(self):
        self.finish()

    def post(self):
        print('ECHO(%s) - %s' % ('POST', self.request.body))
        self.finish()


REQUEST_LIST = []


class TimeoutHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        REQUEST_LIST.append(self.request)
        yield tornado.gen.Task(IOLoop.instance().add_timeout, time.time() + 200)
        return
