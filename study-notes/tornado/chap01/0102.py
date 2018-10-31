#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import textwrap
import tornado.options
import tornado.web
import tornado.httpserver

class WrapHandler(tornado.web.RequestHandler):
    def post(self):
        text = self.get_argument('text')
        width = self.get_argument('width', 40)
        self.write(textwrap.fill(text, int(width)))

class ReverseHandler(tornado.web.RequestHandler):
    def get(self,input):
        self.write(input[::-1])

def main():
    tornado.options.define("port", default=8000,
                           help="run on the given port", type=int)
    tornado.options.parse_command_line()

    handlers = [
        (r"/wrap", WrapHandler),
        (r"/reverse/(\w+)", ReverseHandler),
    ]
    app = tornado.web.Application(handlers)
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(tornado.options.options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
