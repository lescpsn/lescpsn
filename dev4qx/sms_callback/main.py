# -*- coding: utf-8 -*-
import logging
import logging.config
import tornado.ioloop
import tornado.httpserver
import tornado.web
import yaml
from tornado.httpclient import AsyncHTTPClient
from core.diexin_sms_sender import DieXinSmsSender
from handlers.upstream_callback import CallbackUpstreamHandler


class Application(tornado.web.Application):
    def __init__(self):
        log_config = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(log_config)

        self.config = yaml.load(open('config.yaml', 'r', encoding='utf-8'))

        handlers = [
            (r"/upstream/callback/(.*)", CallbackUpstreamHandler),
        ]

        self.sms_sender = DieXinSmsSender(
            baseurl=self.config['diexin']['url'],
            username=self.config['diexin']['username'],
            userpass=self.config['diexin']['userpass']
        )

        tornado.web.Application.__init__(self, handlers)

if __name__ == "__main__":
    AsyncHTTPClient.configure(None, max_clients=50)
    app = Application()
    http_server = tornado.httpserver.HTTPServer(app, xheaders=True)
    http_server.listen(app.config['config']['port'])
    print('http://localhost:{0}/upstream/callback'.format(app.config['config']['port']))
    tornado.ioloop.IOLoop.instance().start()
