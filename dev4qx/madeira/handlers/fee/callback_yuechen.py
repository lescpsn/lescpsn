import logging
import time
import xml.etree.ElementTree as ET

import tornado
from tornado.httpclient import AsyncHTTPClient
from tornado.web import MissingArgumentError

from handlers import signature, BaseHandler
from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': '1',
    '3': '9'
}


# /callback?sid=RO201408271533244583
# &ste=0
# &cid=quxun
# &pid=YDJS00101
# &oid=Q2014082715335400000038
# &pn=13951771065
# &tf=10
# &fm=10
# &info1=&info2=&info3=
# &dm=.9885
# &sign=B94197B31EBD6956403E89F63653E1B1
class CallbackYuechenHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        # check ip

        # parse input
        try:
            sid = self.get_argument('sid')
            up_back_result = ste = self.get_argument('ste')  # 0=success,1=fail
            cid = self.get_argument('cid')
            pid = self.get_argument('pid')
            order_id = oid = self.get_argument('oid')
            pn = self.get_argument('pn')
            tf = self.get_argument('tf')
            fm = self.get_argument('fm')

            sign = self.get_argument('sign')

        except MissingArgumentError as e:
            request_log.info('%s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})
            self.finish()
            return

        # check input
        self.write("success")
        self.finish()

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

        # update order status
        try:
            # check sign
            master = self.master

            order_info = master.hmget('order:' + order_id, [
                'user_id',  # 0
                'value',  # 1
                'stage',  # 2
                'area',  # 3
                'price',  # 4
                'back_url',  # 5
                'sp_order_id',  # 6
                'mobile',  # 7
                'price',  # 8
                'product',  # 9
                'plat_offer_id'  # 10
            ])

            self.order_id = order_id

            self.user_id = order_info[0]
            self.value = int(order_info[1])
            stage = int(order_info[2])

            area = order_info[3]
            self.carrier, self.area = area.split(':')
            self.price = order_info[4]
            self.back_url = order_info[5]

            self.sp_order_id = order_info[6]
            self.mobile = order_info[7]
            self.price = order_info[8]
            self.product = order_info[9]
            self.plat_offer_id = order_info[10]

            self.route = master.hget('order:' + order_id, 'route/%d' % stage)
            self.up_back_result = RESULT_MAP.get(up_back_result, up_back_result)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None or 'key' not in user:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            key = user['key']
            sign2 = signature(sid, ste, cid, pid, oid, pn, tf, fm, key)

            if sign != sign2:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })
        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        # downstream callback or route to next...
        if up_back_result == '0':
            self.callback('1')
        elif up_back_result == '3':
            yield self.dispatch()
        else:
            pass  # TODO: logging & waiting for human
