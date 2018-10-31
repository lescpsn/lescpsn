import json

import tornado.web
import tornado.gen


class WoOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        order_no = self.get_argument('orderNo')
        product = self.get_argument('productId')

        if product[0:2] == '71':
            status = '1'
        else:
            status = '0'

        resp = {
            'desc': '订购成功',
            'status': status,
            'data': {
                'orderId': order_no,
                'code': '0'
            }
        }

        self.finish(json.dumps(resp))


class WoQueryHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        # order_no = self.get_argument('orderNo')

        resp = {
            'desc': '50MB流量充值成功',
            'status': '0',
        }

        self.finish(json.dumps(resp))