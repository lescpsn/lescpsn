#!/usr/bin/env python3
# -*- coding:utf-8 -*-
import os
import tornado.web
import tornado.options
import tornado.httpserver

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('index.html')

class PoemPageHandler(tornado.web.RequestHandler):
    def post(self):
        noun1 = self.get_argument('noun1')
        noun2 = self.get_argument('noun2')
        noun3 = self.get_argument('noun3')
        verb = self.get_argument('verb')
        self.render('poem.html', roads=noun1, wood=noun2,
                    made=verb, difference=noun3)

def main():
    tornado.options.define('port', default=4000,
                           help='run on the given port', type=int)
    tornado.options.parse_command_line()

    handlers = [
        (r"/", IndexHandler),
        (r"/poem", PoemPageHandler),
    ]
    app = tornado.web.Application(handlers=handlers,
                                  template_path=os.path.join(os.path.dirname(__file__), "templates"),
    )
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(tornado.options.options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
