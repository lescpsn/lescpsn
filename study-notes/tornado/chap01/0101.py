#!/usr/bin/env python3
# -*- coding:utf-8 -*-
import tornado.web
import tornado.httpserver

from tornado.options import options
from tornado.options import define

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        greeting = self.get_argument('greeting', 'hello')
        self.write(greeting + ', friendly user!')

def main():
    define("port", default=8888, help="run on the given port", type=int)
    tornado.options.parse_command_line()
    handlers = [
        (r"/", IndexHandler)
    ]
    app = tornado.web.Application(handlers=handlers)
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
