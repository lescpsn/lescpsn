# -*- coding: utf-8 -*-
import logging
import logging.config
from redis.sentinel import Sentinel
import tornado.ioloop
import tornado.httpserver
import tornado.web
from sqlalchemy import create_engine
import yaml
from handlers.domain import ApiDomainHandler
from handlers.fuel import ApiFuelCardHandler

from handlers.product import ApiProductHandler
from handlers.product_view import ApiProductViewHandler
from handlers.product_supply import ApiProductSupplyHandler
from handlers.route_interface import ApiRouteInterfaceHandler
from handlers.route_supply import ApiRouteSupplyHandler
from handlers.special import ApiSpecialHandler
from handlers.user import ApiUserHandler
from tasks.sync_task import SyncTask

LOGO = r"""
__________                                /\ __________
\______   \__ _________ __ __  ______    / / \______   \ ____ ______   ____
 |     ___/  |  \_  __ \  |  \/  ___/   / /   |       _// __ \\____ \ /  _ \
 |    |   |  |  /|  | \/  |  /\___ \   / /    |    |   \  ___/|  |_> >  <_> )
 |____|   |____/ |__|  |____//____  > / /     |____|_  /\___  >   __/ \____/
                                  \/  \/             \/     \/|__|
"""

logger = logging.getLogger()


class Application(tornado.web.Application):
    def __init__(self):
        # self.config = load_config()
        self.config = yaml.load(open('config.yaml', 'r', encoding='utf8'))

        # Logging...
        cfg = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(cfg)

        handlers = [
            (r"/api/user/([a-z_]*)", ApiUserHandler),
            (r"/api/product/([a-z_]*)", ApiProductHandler),
            (r"/api/special/([a-z_]*)", ApiSpecialHandler),
            (r"/api/services/product/([a-z_]*)", ApiProductViewHandler),
            (r"/api/route/product/([a-z_]*)", ApiProductSupplyHandler),
            (r"/api/route/interface/([a-z_/]*)", ApiRouteInterfaceHandler),
            (r"/api/route/supply/([a-z_]*)", ApiRouteSupplyHandler),

            (r"/api/fuelcard/([a-z_]*)", ApiFuelCardHandler),
            (r"/api/domain/([a-z_]*)", ApiDomainHandler),
        ]

        settings = dict(
                # template_path=os.path.join(os.path.dirname(__file__), "templates"),
                # cookie_secret='VoGTaZcHTAKHF7cIL1/ZxFQxfNT/jEPNrE6KtgBQgVg=',
                debug=self.config['config']['debug'],
        )

        tornado.web.Application.__init__(self, handlers, **settings)

        # Have one global connection to the blog DB across all handlers
        self.engine = {}
        for db in self.config['database']:
            self.engine[db] = create_engine(
                    self.config['database'][db],
                    pool_size=2,
                    echo=True,
                    echo_pool=True,
                    pool_recycle=3600)

        sentinels = [(c['ip'], c['port']) for c in self.config['cache']['hosts']]
        self.sentinel = Sentinel(sentinels, db=self.config['cache']['db'],
                                 socket_timeout=0.1, decode_responses=True)

        self.port = self.config['config']['port']


if __name__ == "__main__":
    print(LOGO)
    app = Application()

    print('Welcome to http://localhost:%d/' % app.port)

    SyncTask(app, 3 * 1000).start()

    http_server = tornado.httpserver.HTTPServer(app, xheaders=True)
    http_server.listen(app.port)
    tornado.ioloop.IOLoop.instance().start()
