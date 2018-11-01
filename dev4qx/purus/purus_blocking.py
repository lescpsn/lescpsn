# -*- coding: utf8 -*-
import os
import logging
import logging.config
import pymongo
from redis.sentinel import Sentinel
import tornado.ioloop
import tornado.httpserver
import tornado.web
from sqlalchemy import create_engine
import yaml
import sys
from handler.finance import FinanceBlockingHandler
from handler.query import OrderBlockingQueryHandler, OrderExportBlockingHandler

from handler.mongo.query import OrderMongoQueryHandler
from handler.mongo.finance import FinanceMongoHandler
from handler.mongo.fix import OrderDetailHandler

LOGO = r"""
__________
\______   \__ _________ __ __  ______
 |     ___/  |  \_  __ \  |  \/  ___/
 |    |   |  |  /|  | \/  |  /\___ \
 |____|   |____/ |__|  |____//____  >
                                  \/
"""

logger = logging.getLogger()


class Application(tornado.web.Application):
    def __init__(self):
        # self.config = load_config()
        self.config = yaml.load(open('config.yaml', 'r', encoding='utf8'))

        # adding downstream
        if os.path.exists('downstream.yaml'):
            cfg = yaml.load(open('downstream.yaml', 'r', encoding='utf8'))
            self.config['downstream'] = cfg['downstream']

        # Logging...
        cfg = yaml.load(open('logging_block.yaml', 'r'))
        logging.config.dictConfig(cfg)

        handlers = [
            (r"/query/mongo/(fee|data|sinopec)", OrderMongoQueryHandler),
            (r"/query/block/(fee|data|sinopec)", OrderBlockingQueryHandler),
            (r"/query/(fee|data)/export", OrderExportBlockingHandler),
            (r"/finance/block", FinanceBlockingHandler),
            (r"/finance/mongo", FinanceMongoHandler),
            (r"/services/upblk", OrderDetailHandler),
        ]

        settings = dict(
            # template_path=os.path.join(os.path.dirname(__file__), "templates"),
            # static_path="/home/kevin/PycharmProjects/purus/static/",
            # xsrf_cookies=True,
            # ui_modules=uimodules,
            cookie_secret='VoGTaZcHTAKHF7cIL1/ZxFQxfNT/jEPNrE6KtgBQgVg=',
            # login_url="/auth/login",
            debug=self.config['config']['debug'],
        )

        tornado.web.Application.__init__(self, handlers, **settings)

        # Have one global connection to the blog DB across all handlers
        self.engine = {}
        for db in self.config['database']:
            self.engine[db] = create_engine(
                self.config['database'][db],
                pool_size=1,
                echo=True,
                echo_pool=True,
                pool_recycle=3600)

        sentinels = [(c['ip'], c['port']) for c in self.config['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, decode_responses=True)

        self.port = self.config['config']['port_block']

        if 'mongodb' in self.config:
            self.mongo1 = pymongo.MongoClient(self.config['mongodb']['GLaDOS'])
            self.mongo2 = pymongo.MongoClient(self.config['mongodb']['forrestal'])


if __name__ == "__main__":
    print(LOGO)
    app = Application()

    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    else:
        port = app.port

    print(port)

    print('Welcome to http://localhost:%d/' % port)

    http_server = tornado.httpserver.HTTPServer(app, xheaders=True)
    http_server.listen(port)
    tornado.ioloop.IOLoop.instance().start()
