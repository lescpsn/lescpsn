# -*- coding: utf-8 -*-
import logging.config
import pymongo
import yaml
import tornado.httpserver
import tornado.ioloop
import tornado.web
import logging
import motor
from redis.sentinel import Sentinel
from tornado.httpclient import AsyncHTTPClient
from handlers.inbox import InboxHandler
from task.subscribe import SubscribeTask
from lib.mylib import  get_local_ip

LOGO = r"""
   _____                                                __________             .__
  /     \   ____   ______ ___________     ____   ____   \______   \__ __  _____|  |__
 /  \ /  \_/ __ \ /  ___//  ___/\__  \   / ___\_/ __ \   |     ___/  |  \/  ___/  |  \
/    Y    \  ___/ \___ \ \___ \  / __ \_/ /_/  >  ___/   |    |   |  |  /\___ \|   Y  \
\____|__  /\___  >____  >____  >(____  /\___  / \___  >  |____|   |____//____  >___|  /
        \/     \/     \/     \/      \//_____/      \/                       \/     \/
"""
logger = logging.getLogger()


class Application(tornado.web.Application):
    def __init__(self):
        self.config = yaml.load(open('config.yaml', 'r', encoding='utf-8'))
        self.port = self.config['config']['port']
        cfg = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(cfg)

        handlers = [
            (r"/inbox", InboxHandler),

        ]
        settings = dict(
                debug=self.config['config']['debug'],
        )
        tornado.web.Application.__init__(self, handlers, **settings)
        sentinels = [(c['ip'], c['port']) for c in self.config['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=15, decode_responses=True)
        self.conn = motor.motor_tornado.MotorClient(
            self.config['connection']['mongo_messagepush']
        )


def main():
    AsyncHTTPClient.configure(None, max_clients=400)
    local_ip = get_local_ip()
    app = Application()
    SubscribeTask(app, 10 * 1000).start()
    http_server = tornado.httpserver.HTTPServer(app, xheaders=True)
    http_server.listen(app.port)
    print("%s\naccess url: http://[%s]:%d/inbox"%(LOGO,'|'.join(local_ip),app.port))
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
