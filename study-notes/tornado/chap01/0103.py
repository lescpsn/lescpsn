#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import tornado.httpserver
import tornado.web
import tornado.options

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("this is a GET request")

    def write_error(self, status_code, **kwargs):
        self.write("\033[31mInvoking IndexHandler Error:\033[0m")

def main():
    tornado.options.define("port", default=8000,
                           help="run on the given port", type=int)
    tornado.options.parse_command_line()

    handlers = [
        (r'/', IndexHandler),
    ]
    app = tornado.web.Application(handlers=handlers)
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(tornado.options.options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
