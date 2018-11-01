# -*- coding: utf-8 -*-
import logging
import logging.config
import os.path
from concurrent.futures.process import ProcessPoolExecutor
from concurrent.futures.thread import ThreadPoolExecutor

import motor as motor
import tornado.httpserver
import tornado.ioloop
import tornado.web
import yaml
from sqlalchemy import create_engine
from tornado.httpclient import AsyncHTTPClient

import uimodules
from handler import ReactContentHandler
from handler.admin.admin_withdraw import AdminWithdrawHandler
from handler.admin.card import AdminCardHandler
from handler.admin.cmcc_fee_route_switch import AdminCmccFeeRouteSwitchHandler
from handler.admin.config import ConfigHandler
from handler.admin.data_routing import AdminDataRoutingHandler
from handler.admin.downstream import DownstreamHandler
from handler.admin.fee_quota import AdminFeeQuotaHandler
from handler.admin.forrestal_query import ForrestalQueryHandler
from handler.admin.fund import AdminFundHandler
from handler.admin.meituan import ApiMeituanHandler, MeituanCallbackHandler
from handler.admin.price import PriceHandler
from handler.admin.pricing import PricingHandler
from handler.admin.product import ProductHandler, ProductUserHandler
from handler.admin.qunxun_card import AdminQuxunCardHandler
from handler.admin.qunxun_card_query import AdminQuxunCardQueryHandler
from handler.admin.qunxun_data_card import AdminQuxunDataCardHandler, AdminQuxunDataCardPageHandler, \
    AdminQuxunDataCardFileHandler
from handler.admin.quxun_sinopec_card import AdminQuxunSinopecCardHandler
from handler.admin.reload import ReloadHandler
from handler.admin.route import AdminRouteHandler
from handler.admin.routing import AdminRoutingHandler
from handler.admin.special import SpecialHandler
from handler.admin.statistics import AdminStatisticsHandler
from handler.api.balance import ApiBalanceHandler
from handler.api.callback import ApiManualCallbackHandler
from handler.api.check_latest import ApiChargeCheckHandler
from handler.api.deposit_auth import ApiDepositAuth, ApiDepositCheckAuth, ApiDepositRefreshAuth
from handler.api.deposit_service import ApiDepositDetailList
from handler.api.deposit_service import ApiDepositList, ApiDepositAdjust, ApiDepositApply, ApiHistoryList, \
    ApiDepositApprove
from handler.api.domain import ApiDomainHandler
from handler.api.downstream import ApiDownstreamHandler
from handler.api.get_price import ApiGetProductHandler
from handler.api.product import ApiProductHandler
from handler.api.product_user import ApiProductUserHandler
from handler.api.query import ApiExportRequestHandler, ApiQueryFinanceHandler, \
    ApiQueryOrderHandler
from handler.api.register import ApiRegisterHandler
from handler.api.route import ApiRouteHandler
from handler.api.special import ApiSpecialHandler
from handler.api.upstream import ApiUpstreamHandler
from handler.api.user import ApiUserHandler, ApiInterfaceHandler
from handler.api.product_query import ApiProductQueryHandler




from handler.auth.login import LoginHandler, LogoutHandler
from handler.auth.password import PasswordHandler
from handler.captcha import CaptchaHandler
from handler.charge import ChargeHandler
from handler.charge_batch import BatchChargeHandler
from handler.dashboard import MainHandler
from handler.fuel_card.big_recharge import FuelCardBigRechargeHandler, FuelCardCallBackHandler, \
    FuelCardModemForrestaCalllHandler, FuelCardBigRechargeCheckHandler
from handler.fuel_card.bot_account import FuelCardBotAccountHandler
from handler.fuel_card.call_modem_forrestal import FuelCardCallModemForrestalHandler
from handler.fuel_card.card_inventory import CardInventoryHandler
from handler.fuel_card.customer_list import FuelCardCustomerListHandler
from handler.fuel_card.help import FuelCardHelpHandler
from handler.fuel_card.order_list import FuelCardOrderListHandler, FuelCardExport
from handler.fuel_card.single_recharge import FuelCardSingleRechargeHandler
from handler.fund.add_fund import AddFundHandler
from handler.fund.yeepay import YeepayHandler, YeepayCallbackHandler
from handler.mongo.fix import QueryOrderListHandler, QueryOrderDetailHandler, ManualFixHandler
from handler.mongo.sinopec_order_query import SinopecOrderQueryHandler
from handler.query import OrderExportHandler
from handler.sinopec_charge import SinopecChargeHandler
from handler.withdraw import WithdrawHandler
from utils.phone import MobileClassifier
from utils.redis_driver import RedisDriver

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
            self.config['user'] = cfg['user']
            self.config['domain'] = cfg.get('domain')
            self.config['interface'] = cfg.get('interface')

        # adding password
        if os.path.exists('password.yaml'):
            cfg = yaml.load(open('password.yaml', 'r', encoding='utf8'))
            self.password = cfg

        # Logging...
        cfg = yaml.load(open('logging.yaml', 'r'))
        logging.config.dictConfig(cfg)

        handlers = [
            (r"/", tornado.web.RedirectHandler, {"url": "/dashboard"}),
            (r"/dashboard", MainHandler),
            # (r"/query/(sinopec)", OrderQueryHandler),
            (r"/query/sinopec", ReactContentHandler, {"path": "query_order.html"}),
            (r"/query/data", ReactContentHandler, {"path": "query_data.html"}),
            (r"/query/fee", ReactContentHandler, {"path": "query_fee.html"}),
            (r"/services/callback", ReactContentHandler, {"path": "services/callback.html"}),
            # (r"/query/sinopec", ReactContentHandler, {"path": "query_sinopec.html"}),
            # (r"/finance", FinanceHandler),
            (r"/query/(fee|data)/export", OrderExportHandler),
            (r"/finance", ReactContentHandler, {"path": "finance2.html"}),
            (r"/api/query/(data|fee|sinopec)", ApiQueryOrderHandler),
            (r"/api/query/finance", ApiQueryFinanceHandler),
            (r"/api/export/(data|fee|sinopec|finance)", ApiExportRequestHandler),

            (r"/charge/data/single(/[a-z]+)?", ChargeHandler),
            (r"/charge/data/batch(/[a-z]+)?", BatchChargeHandler),
            (r"/charge/sinopec/single(/[a-z]+)?", SinopecChargeHandler),
            # auth
            (r"/auth/login", LoginHandler),
            (r"/auth/logout", LogoutHandler),
            (r"/auth/password", PasswordHandler),
            (r"/auth/captcha.jpg", CaptchaHandler),

            # -------------- admin --------------
            (r"/admin/fund(/order)?", AdminFundHandler),
            # (r"/admin/pricing", AdminPricingHandler),
            (r"/admin/reload", ReloadHandler),
            (r"/admin/card(/[a-z]+)?", AdminCardHandler),
            (r"/admin/quxun_card(/.*)?", AdminQuxunCardHandler),
            (r"/admin/quxun_card_query", AdminQuxunCardQueryHandler),
            (r"/admin/quxun_sinopec_card(/.*)?", AdminQuxunSinopecCardHandler),
            (r"/api/data_card(/.*)", AdminQuxunDataCardHandler),
            (r"/data_card_file(/.*)?", AdminQuxunDataCardFileHandler),
            (r"/data_card(/.*)?", AdminQuxunDataCardPageHandler),
            # (r"/admin/meituan", AdminMeituanHandler),
            (r"/admin/routing(/[a-z]+)?", AdminRoutingHandler),
            (r"/admin/config", ConfigHandler),
            (r"/admin/pricing", PricingHandler),
            (r"/admin/fee_quota", AdminFeeQuotaHandler),
            (r"/admin/product", ProductHandler),
            (r"/admin/product_user", ProductUserHandler),
            (r"/admin/price", PriceHandler),
            (r"/admin/special", SpecialHandler),
            (r"/admin/cmcc_fee_route_switch(/.*)?", AdminCmccFeeRouteSwitchHandler),
            (r"/downstream/(approval|management|admin)", DownstreamHandler),
            (r"/route/(interface|supply|product-supply|user-supply)", AdminRouteHandler),

            (r"/api/domain/(.*)", ApiDomainHandler),
            (r"/admin/domain", ReactContentHandler, {'path': 'admin_domain_list.html', 'role': 'admin'}),

            (r"/api/upstream/(.*)", ApiUpstreamHandler),
            (r"/admin/upstream", ReactContentHandler, {'path': 'deposit_upstream.html', 'role': 'admin'}),

            # fund
            (r"/add_fund", AddFundHandler),
            (r"/yeepay(.*)", YeepayHandler),
            (r"/callback/yeepay", YeepayCallbackHandler),
            (r"/forrestal_query(/.*)", ForrestalQueryHandler),

            # -------------- Api --------------
            (r"/api/latest_check", ApiChargeCheckHandler),
            (r"/api/balance", ApiBalanceHandler),
            (r"/api/register", ApiRegisterHandler),
            (r"/api/downstream/(.*)", ApiDownstreamHandler),
            (r"/api/route/(.*)", ApiRouteHandler),
            (r"/api/product/user/(.*)", ApiProductUserHandler),
            (r"/api/product/(.*)", ApiProductHandler),

            (r"/api/user/(.*)", ApiUserHandler),
            (r"/api/interface/(.*)", ApiInterfaceHandler),
            (r"/api/special/(.*)", ApiSpecialHandler),

            (r"/api/get_product", ApiGetProductHandler),

            # api - meituan
            (r"/api/meituan/callback", MeituanCallbackHandler),
            (r"/api/meituan/submit", ApiMeituanHandler),

            # api - deposit
            (r"/fund/deposit/apply", ReactContentHandler, {"path": "deposit_apply.html"}),
            (r"/services/deposit/approve", ReactContentHandler, {"path": "deposit_service.html"}),
            (r"/admin/deposit/quota", ReactContentHandler, {"path": "deposit_quota.html"}),

            (r"/api/deposit/auth", ApiDepositAuth),
            (r"/api/deposit/check_auth", ApiDepositCheckAuth),
            (r"/api/deposit/refresh_auth", ApiDepositRefreshAuth),
            (r"/api/deposit/list", ApiDepositList),
            (r"/api/deposit/list_detail", ApiDepositDetailList),
            (r"/api/deposit/adjust", ApiDepositAdjust),
            (r"/api/deposit/apply", ApiDepositApply),
            (r"/api/deposit/apply_list", ApiHistoryList),
            (r"/api/deposit/approve", ApiDepositApprove),

            # fuel_card
            (r"/fuel_card/help", FuelCardHelpHandler),
            (r"/fuel_card/card_inventory", CardInventoryHandler),
            (r"/fuel_card/bot_account", FuelCardBotAccountHandler),
            (r"/fuel_card/customer_list", FuelCardCustomerListHandler),
            (r"/fuel_card/single_recharge", FuelCardSingleRechargeHandler),
            (r"/fuel_card/big_recharge", FuelCardBigRechargeHandler),
            (r"/fuel_card/order_list", FuelCardOrderListHandler),
            (r"/fuel_card/callback", FuelCardCallBackHandler),
            (r"/fuel_card/modem_forrestal(/.*)?", FuelCardCallModemForrestalHandler),
            (r"/fuel_card/modem_forrestal_call", FuelCardModemForrestaCalllHandler),
            (r"/fuel_card/export(/.*)", FuelCardExport),
            (r"/fuel_card/big_recharge_task_check", FuelCardBigRechargeCheckHandler),

            #withdraw 提现
            (r"/withdraw", WithdrawHandler),
            (r"/admin/withdraw_list", ReactContentHandler, {'path': 'withdraw_list.html'}),
            (r"/admin/withdraw", AdminWithdrawHandler),

            # html and assets
            (r"/(.*html)", tornado.web.StaticFileHandler, {"path": "static"}),
            (r"/((assets|css|js|img|fonts)/.*)", tornado.web.StaticFileHandler, {"path": "static"}),
            (r'/exports/(.*xlsx)', tornado.web.StaticFileHandler, {'path': 'exports'}),

            # service center
            (r"/services/order", ReactContentHandler, {'path': 'single-card.html', 'role': 'services'}),   
            (r"/services/product", ReactContentHandler, {'path': 'product-query.html', 'role': 'services'}),
            (r"/api/services/product/(.*)", ApiProductQueryHandler),                
            (r"/api/services/order", QueryOrderListHandler),
            (r"/api/services/ups", QueryOrderDetailHandler),
            (r"/api/services/manual", ManualFixHandler),
            (r"/api/services/callback/(.*)", ApiManualCallbackHandler),

            (r"/services/statistics(.*)", AdminStatisticsHandler),
            (r"/services/data_routing(/[a-z]+)?", AdminDataRoutingHandler),
            (r"/api/sinopec_order_query", SinopecOrderQueryHandler),
        ]

        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            # static_path="/home/kevin/PycharmProjects/purus/static/",
            # xsrf_cookies=True,
            ui_modules=uimodules,
            cookie_secret='VoGTaZcHTAKHF7cIL1/ZxFQxfNT/jEPNrE6KtgBQgVg=',
            login_url="/auth/login",
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

        self.redis_driver = RedisDriver(self.config['cache'])

        self.port = self.config['config']['port']

        self.repo = None
        # if 'repo' in self.config:
        #     self.repo = ConfigRepo(self.config['repo'])

        self.password = yaml.load(open('password.yaml', 'r', encoding='utf8'))

        self.classifier = MobileClassifier()

        self.title = self.config['config'].get('title') or ''

        if 'glados' in self.config['connection']:
            self.glados_client = motor.motor_tornado.MotorClient(self.config['connection']['glados'])
        self.process_executor = ProcessPoolExecutor(4)
        self.thread_executor = ThreadPoolExecutor(4)


if __name__ == "__main__":
    AsyncHTTPClient.configure(None, max_clients=100)
    print(LOGO)
    app = Application()

    for domain_id in app.config['domain']:
        print('Welcome to %s - http://%s/' % (
            app.config['domain'][domain_id]['title'], app.config['domain'][domain_id]['host']))

    # FuelCardBigRechargeCheckHandler.check(app)  #检查被异常终止的大额充值任务,并自动开始任务

    http_server = tornado.httpserver.HTTPServer(app, xheaders=True)
    http_server.listen(app.port)
    tornado.ioloop.IOLoop.instance().start()
