#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import os
import random
import tornado.web
import tornado.options
import tornado.httpserver

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('index.html')

class MungedPageHandler(tornado.web.RequestHandler):
    def map_by_first_letter(self, text):
        mapped = dict()
        for line in text.split('\r\n'):
            for word in [x for x in line.split(' ') if len(x) > 0]:
                if word[0] not in mapped: mapped[word[0]] = []
                mapped[word[0]].append(word)
        return mapped
    def post(self):
        source_text = self.get_argument('source')
        text_to_change = self.get_argument('change')
        source_map = self.map_by_first_letter(source_text)
        change_lines = text_to_change.split('\r\n')
        print("***********t101:")
        print(source_map)
        print(change_lines)
        print(random.choice)
        self.render('munged.html', source_map=source_map,
                    change_lines=change_lines, choice=random.choice)

def main():
    tornado.options.define('port', default=4000,
                           help="run on the given port", type=int)
    tornado.options.parse_command_line()
    handlers = [
        (r'/', IndexHandler),
        (r'/poem', MungedPageHandler),
    ]
    template_path = os.path.join(os.path.dirname(__file__), "templates")
    static_path = os.path.join(os.path.dirname(__file__), "static"),
    app = tornado.web.Application( handlers=handlers,
                                   template_path = template_path,
                                   static_path = static_path
                                  )

    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(tornado.options.options.port)
    tornado.ioloop.IOLoop.instance().start()



if __name__ == "__main__":
    main()
