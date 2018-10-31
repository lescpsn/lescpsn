# coding=utf8
import logging
import logging.config
import os

import motor
import tornado.httpserver
import tornado.ioloop
import tornado.web
import yaml
from redis.sentinel import Sentinel
from tornado.httpclient import AsyncHTTPClient

from handlers import ErrorHandler
from handlers.admin.config import ConfigHandler
from handlers.admin.fund import FundHandler
from handlers.admin.info import InfoHandler
from handlers.admin.pricing import PricingHandler
from handlers.admin.reload import ReloadHandler
from handlers.data.aspire_callback import CallbackAspireHandler
from handlers.data.aspire_ec_callback2 import CallbackAspireEC2Handler
from handlers.data.bitfeng_callback import CallbackBitfengHandler
from handlers.data.callback_standard import CallbackStandardHandler
from handlers.data.cmcc_callback import CallbackCmccHandler
from handlers.data.cmcc_ha_callback import CallbackCmcchaHandler
from handlers.data.cmcc_sn__callback import CallbackCmccSnHandler
from handlers.data.cmcc_states_callback import CallbackCmccStatesHandler
from handlers.data.dahanfc_callback import CallbackDahanfcHandler
from handlers.data.data21cn_callback import Callback21CnHandler
from handlers.data.faliuliang2_callback import CallbackFaliuliang2Handler
from handlers.data.gmall_callback import CallbackGmallHandler
from handlers.data.ibumobile_callback import CallbackIbumobileHandler
from handlers.data.ibumobile2_callback import CallbackIbumobile2Handler
from handlers.data.idatafocus_callback import CallbackIdatafocusHandler
from handlers.data.llfengbao_callback import CallbackLlfengbaoHandler
from handlers.data.llreader_callback import CallbackLlreaderHandler
from handlers.data.lemian_callback import CallbackLemianHandler
from handlers.data.migu_callback import CallbackMiguHandler
from handlers.data.mopote_callback import CallbackMopoteHandler
from handlers.data.niukou_callback import CallbackNiukouHandler
from handlers.data.order import DataOrderHandler
from handlers.data.people_callback import CallbackPeopleHandler
from handlers.data.query import DataQueryHandler
from handlers.data.quxun_callback import CallbackQuxunHandler
from handlers.data.raiyi_callback import CallbackRaiyiHandler
from handlers.data.ruanyunbi_callback import CallbackRuanyunbiHandler
from handlers.data.shangtong_callback import CallbackShangtongHandler
from handlers.data.suopai_callback import CallbackSuopaiHandler
from handlers.data.telecom_gz_callback import CallbackTelecomGzHandler
from handlers.data.trafficweb_callback import CallbackTrafficwebHandler
from handlers.data.xiamen_zyt_callback import CallbackXiamenZytHandler
from handlers.data.xiaowo_callback import CallbackXiaowoHandler
from handlers.data.xicheng_callback import XichengCallbackHandler
from handlers.data.yflow_callback import CallbackYflowHandler
from handlers.data.yucheng_callback import CallbackYuchengHandler



from handlers.data.zhixin_callback import CallbackZhixinHandler
from handlers.data.zhjxzy_callback import CallbackZhjxzyHandler

from handlers.fee.balance import BalanceHandler
from handlers.fee.callback_esai import CallbackESaiHandler
from handlers.fee.callback_jiebei import CallbackJiebeiHandler
from handlers.fee.callback_jinfeng import CallbackJinfengHandler
from handlers.fee.callback_manual import CallbackManualHandler
from handlers.fee.callback_shili import CallbackShiliHandler
from handlers.fee.callback_standard import CallbackHandler, CallbackSukaHandler
from handlers.fee.callback_yuechen import CallbackYuechenHandler
from handlers.fee.order import OrderHandler
from handlers.fee.query import QueryHandler
from utils.phone import MobileClassifier

LOGO = r'''
   _____              .___     .__                    /\ ________
  /     \ _____     __| _/____ |__|___________       / / \_____  \
 /  \ /  \\__  \   / __ |/ __ \|  \_  __ \__  \     / /   /  ____/
/    Y    \/ __ \_/ /_/ \  ___/|  ||  | \// __ \_  / /   /       \
\____|__  (____  /\____ |\___  >__||__|  (____  / / /    \_______ \
        \/     \/      \/    \/               \/  \/             \/
A tributary of Amazon
(C) 2014, Quxun Network
'''


class Application(tornado.web.Application):
    def __init__(self):
        # Global config...
        self.config = yaml.load(open('config.yaml', 'r', encoding='utf8'))

        # Logging...
        cfg = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(cfg)

        # adding downstream
        if os.path.exists('downstream.yaml'):
            cfg = yaml.load(open('downstream.yaml', 'r', encoding='utf8'))
            self.config['downstream'] = cfg.get('downstream')

        handlers = [
            (r"/health", ErrorHandler),
            # Public API
            (r"/order.do", OrderHandler),
            (r"/query.do", QueryHandler),
            # Callback
            (r"/callback/sk.do", CallbackSukaHandler),
            (r"/callback/ld.do", CallbackHandler),
            (r"/callback/ECServicesForADC.*", CallbackCmccHandler),
            (r"/callback/cmcc2/ECServicesForADC.*", CallbackCmccStatesHandler),
            (r"/callback/shili.do", CallbackShiliHandler),
            (r"/callback/quxun", CallbackQuxunHandler),
            (r"/callback/xicheng", XichengCallbackHandler),
            (r"/callback/aspire.do", CallbackAspireHandler),
            # (r"/callback/cmcc3.do", CallbackAspireECHandler),
            (r"/callback/cmcc3.do", CallbackAspireEC2Handler),
            (r"/callback/dahanfc.do", CallbackDahanfcHandler),
            (r"/callback/standard", CallbackStandardHandler),
            (r"/callback/yuechen.do", CallbackYuechenHandler),
            (r"/callback/esai.do", CallbackESaiHandler),
            (r"/callback/mopote", CallbackMopoteHandler),
            (r"/callback/cmccsn", CallbackCmccSnHandler),
            (r"/callback/cmccha", CallbackCmcchaHandler),
            (r"/callback/manual", CallbackManualHandler),
            (r"/callback/niukou", CallbackNiukouHandler),
            (r"/callback/xiaowo", CallbackXiaowoHandler),
            (r"/callback/migu", CallbackMiguHandler),
            (r"/callback/llreader", CallbackLlreaderHandler),
            (r"/callback/gmall", CallbackGmallHandler),
            (r"/callback/llfengbao", CallbackLlfengbaoHandler),
            (r"/callback/ruanyunbi", CallbackRuanyunbiHandler),
            (r"/callback/raiyi", CallbackRaiyiHandler),
            (r"/callback/yflow", CallbackYflowHandler),
            (r"/callback/zhjxzy", CallbackZhjxzyHandler),
            (r"/callback/xiamen_zyt", CallbackXiamenZytHandler),
            (r"/callback/ibumobile", CallbackIbumobileHandler),
            (r"/callback/faliuliang2", CallbackFaliuliang2Handler),
            (r"/callback/trafficweb", CallbackTrafficwebHandler),
            (r"/callback/bitfeng", CallbackBitfengHandler),
            (r"/callback/idatafocus", CallbackIdatafocusHandler),
            (r"/callback/zhixin", CallbackZhixinHandler),
            (r"/callback/shangtong", CallbackShangtongHandler),
            (r"/callback/jinfeng", CallbackJinfengHandler),
            (r"/callback/people", CallbackPeopleHandler),
            (r"/callback/telecom_gz", CallbackTelecomGzHandler),
            (r"/callback/suopai", CallbackSuopaiHandler),
            (r"/callback/zhongshenyuan", CallbackIbumobile2Handler),
            (r"/callback/yucheng", CallbackYuchengHandler),
            (r"/callback/lemian", CallbackLemianHandler),

            #fee
            (r"/callback/jiebei", CallbackJiebeiHandler),

            (r"/data/order", DataOrderHandler),
            (r"/data/callback", Callback21CnHandler),
            (r"/flow/callback.htm", Callback21CnHandler),  #
            (r"/data/(prod|query|balance)", DataQueryHandler),
            (r"/balance.do", BalanceHandler),
            (r"/admin/fund", FundHandler),
            (r"/admin/reload", ReloadHandler),
            (r"/admin/config", ConfigHandler),
            (r"/admin/pricing", PricingHandler),
            (r"/admin/info", InfoHandler),
            (r"/.*", ErrorHandler),
        ]

        settings = dict(
            cookie_secret='VoGTaZcHTAKHF7cIL1/ZxFQxfNT/jEPNrE6KtgBQgVg=',
            debug=self.config['config']['debug'],
        )

        tornado.web.Application.__init__(self, handlers, **settings)

        sentinels = [(c['ip'], c['port']) for c in self.config['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=1, decode_responses=True)

        self.classifier = MobileClassifier('area_v4.bin')

        self.port = self.config['config']['port']

        if 'connection' in self.config and 'glados' in self.config['connection']:
            self.glados_client = motor.motor_tornado.MotorClient(self.config['connection']['glados'])


if __name__ == "__main__":
    AsyncHTTPClient.configure(None, max_clients=400)
    print(LOGO)

    app = Application()

    print('http://localhost:%d/data/prod' % app.port)
    http_server = tornado.httpserver.HTTPServer(app, xheaders=True)
    http_server.listen(app.port)
    tornado.ioloop.IOLoop.instance().start()
