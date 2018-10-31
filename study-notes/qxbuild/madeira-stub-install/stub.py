# coding=utf8
import logging.config
import os.path
import tornado.httpserver
import tornado.ioloop
import tornado.web
import yaml
from redis.sentinel import Sentinel

from handlers import EchoHandler
from handlers import TimeoutHandler
from handlers.cloud.login import CloudLoginHandler
from handlers.cloud.order import CloudOrderHandler
from handlers.stub.aspire_ec import AspireECOrderHandler
from handlers.stub.bitfeng import BitfengOrderHandler
from handlers.stub.cmcc import CmccOrderHandler
from handlers.stub.cmcc_states import CmccStatesHandler
from handlers.stub.faliuliang2 import Faliuliang2OrderHandler
from handlers.stub.gmall import GmallOrderHandler
from handlers.stub.ibumobile import IbumobileOrderHandler
from handlers.stub.mopota import MopotaOrderHandler
from handlers.stub.niukou import NiukouOrderHandler
from handlers.stub.raiyi import RaiyiOrderHandler
from handlers.stub.seek import SeekHandler
from handlers.stub.suka import SukaOrderHandler
from handlers.stub.telecom_js import Telecom_jsOrderHandler
from handlers.stub.trafficweb import TrafficwebOrderHandler
from handlers.stub.twentyfirst_order import TwentyFirstOrderHandler
from handlers.stub.wo import WoOrderHandler, WoQueryHandler
from handlers.stub.xiamen_zyt import XiamenZytOrderHandler
from handlers.stub.shangtong import ShangtongOrderHandler
from handlers.stub.xiaowo import XiaowoOrderHandler
from handlers.stub.xicheng import XichengOrderHandler
from handlers.stub.yflow import YflowOrderHandler
from handlers.unit.callback import CallbackHandler
from handlers.unit.query import UnitQueryHandler
from handlers.unit.start import UnitStartHandler
from handlers.unit.tools import UnitToolsHandler
from utils.phone import MobileClassifier

LOGO = r'''
   _____              .___     .__                _________ __       ___.
  /     \ _____     __| _/____ |__|___________   /   _____//  |_ __ _\_ |__
 /  \ /  \\__  \   / __ |/ __ \|  \_  __ \__  \  \_____  \\   __\  |  \ __ \
/    Y    \/ __ \_/ /_/ \  ___/|  ||  | \// __ \_/        \|  | |  |  / \_\ \
\____|__  (____  /\____ |\___  >__||__|  (____  /_______  /|__| |____/|___  /
        \/     \/      \/    \/               \/        \/                \/
A tributary of Amazon
(C) 2014, Quxun Network
'''


class Application(tornado.web.Application):
    def __init__(self):
        cfg = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(cfg)

        handlers = [
            (r"/", tornado.web.RedirectHandler, {"url": "/unit/start"}),
            # testing UI
            (r"/unit/start", UnitStartHandler),
            (r"/unit/query", UnitQueryHandler),
            (r"/unit/tools/(.*)", UnitToolsHandler),
            (r"/data/callback", CallbackHandler),

            ###############################
            # Stub
            (r"/onlinepay.do", SukaOrderHandler),  # stub - suka
            (r"/fps/flowService.do", TwentyFirstOrderHandler),  # stub - 21cn
            (r"/api/usr_auth.aspx", CloudLoginHandler),  # stub - cloud
            (r"/api/svr_do_postOrder.aspx", CloudOrderHandler),  # stub - cloud
            (r"/r/Channel/(createOrder|submitOrder)", SeekHandler),  # stub - seek
            (r"/openapitest/product/backOrderInterfaceNew.jsonp", WoOrderHandler),
            (r"/openapitest/product/queryBackOrderResultNew.jsonp", WoQueryHandler),
            (r"/FPInterface_b/NGADCServicesForEC.svc/NGADCServicesForEC", CmccStatesHandler),

            (r"/custinte/order.do", XichengOrderHandler),  # 西城
            (r"/jszt/ipauth/orderPackageByQiXin", Telecom_jsOrderHandler),  # 江苏电信
            (r"/recharge/order", MopotaOrderHandler),  # 魔品
            (r"/client/adcservice-CompanyNgec-rechargeFlow.do", IbumobileOrderHandler),  # 中深源
            (r"/NGADCInterface/NGADCServicesForEC.svc/NGADCServicesForEC", CmccOrderHandler),  # GD
            (r"/flow/order.do", XiamenZytOrderHandler),  # Xiamen
            (r"/ec_serv_intf/forec", AspireECOrderHandler),  # Aspire for EC
            (r"/pf/api/1.0/order/create", Faliuliang2OrderHandler),  # 5A流量
            (r"/e7chong/putorders.php", TrafficwebOrderHandler),  # 乐流
            (r"/bitfeng_test/charge_std_test/index", BitfengOrderHandler),  # 比特峰
            (r"/interface/SendOrder", GmallOrderHandler),  # 极猫
            (r"/makeorder.php", NiukouOrderHandler),  # 纽扣
            (r"/v1/private/193/order/buyFlow", RaiyiOrderHandler),  # 瑞翼
            (r"/server/store/servicedata.do", XiaowoOrderHandler),  # 小沃
            (r"/api/allocate.action", YflowOrderHandler),  # 云流
            (r"/api.ds400.com/Charge.html", ShangtongOrderHandler),  # 尚通



            # Others
            (r"/timeout", TimeoutHandler),

            # asserts
            (r"/((js|css|fonts)/.*)", tornado.web.StaticFileHandler, {"path": "static"}),
            (r"/.*", EchoHandler),
        ]

        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            cookie_secret='VoGTaZcHTAKHF7cIL1/ZxFQxfNT/jEPNrE6KtgBQgVg=',
            debug=True,
        )

        tornado.web.Application.__init__(self, handlers, **settings)

        self.last_order = None
        self.classifier = MobileClassifier()

        self.config = yaml.load(open('config.yaml', 'r', encoding='utf-8'))
        cfg = yaml.load(open('downstream.yaml', 'r', encoding='utf-8'))
        self.config['downstream'] = cfg['downstream']

        sentinels = [(c['ip'], c['port']) for c in self.config['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=3, decode_responses=True)


if __name__ == "__main__":
    print(LOGO)
    http_server = tornado.httpserver.HTTPServer(Application(), xheaders=True)
    http_server.listen(8900)
    print('Listen on http://localhost:8900')
    tornado.ioloop.IOLoop.instance().start()
