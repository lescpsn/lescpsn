#!/usr/bin/env python3
# -*- coding:utf-8 -*-
#
# Copyright 2016-02-18 Nanjing Quxun Network Technology Co.,Ltd

import tornado
import os.path
import motor as motor
import yaml
import logging
import logging.config

from handler.api.overview import ApiOverviewHandler
from handler.api.overview import ApiAllOverviewHandler
from handler.api.overview import ApiServerlisHandler
from handler.api.execommand import ApiExeCommandHandler
from handler.ssh_pool import *

LOGO = r"""
  __________   ____
 /  ___/  _ \ / ___\
 \___ (  <_> ) /_/  >
/____  >____/\___  /
     \/     /_____/

"""
log = logging.getLogger('request')

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

class CmdHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("sog_execmd.html")

class Application(tornado.web.Application):
    def __init__(self):
        self.config = yaml.load(open('config.yaml', 'r', encoding='utf-8'))
        self.port = self.config['config']['port']

        self.mongo_sog = motor.motor_tornado.MotorClient(
            self.config['mongodb']['mongo_sog'])
        self.sshpool = SSHPool()

        cfg = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(cfg)

        handlers = [
            (r"/", MainHandler),
            (r"/api/command", ApiExeCommandHandler),
            (r"/api/overview/list", ApiServerlisHandler),
            (r"/api/upstream", ApiAllOverviewHandler),
            (r"/api/upstream?", ApiOverviewHandler),

            (r"/(.*html)", tornado.web.StaticFileHandler, {"path": "templates"}),
            (r"/((assets|css|js|img|fonts|jsx)/.*)",
             tornado.web.StaticFileHandler, {"path": "static"}),
        ]

        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
        )
        tornado.web.Application.__init__(self, handlers, **settings)

def main():
    app = Application()
    app.listen(app.port)
    print('Welcome to %shttp://localhost:%d/' % (LOGO, app.port))
    tornado.ioloop.IOLoop.current().start()
if __name__ == "__main__":
    main()
