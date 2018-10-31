import logging
import xml.etree.ElementTree as ET
import time

import tornado.gen
from handlers import signature64

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': '1',
    '1003': '9'  # keep fail
}


class XichengCallbackHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):

        try:
            body = self.request.body.decode()
            root = ET.fromstring(body)

            u_order_id = 'Q20' + root.findall('.//orderId')[0].text
            request_log.info('CALLBACK %s - %s' % (self.request.uri, body.replace('\r\n', '')),
                             extra={'orderid': u_order_id})

            head = root.find('head')
            cust_id = head.find('custInteId').text
            echo = head.find('echo').text
            tsp = head.find('timestamp').text
            sign0 = head.find('chargeSign').text

            upstream = self.application.config.get('upstream')
            _key, partner = next(filter(lambda p: p[1].get('cust_id') == cust_id, upstream.items()), (None, None))
            if partner is None:
                request_log.error('CANNOT FOUND XICHENG CUST_ID %s', cust_id)
                self.send_error(500)
                return

            secret = partner.get('secret')

            sign1 = signature64(cust_id + echo + secret + tsp)
            if sign1 == sign0:
                self.finish('<response><result>0000</result><desc></desc></response>')
            else:
                request_log.warn('INVALID SIGN', extra={'orderid': u_order_id})
                self.finish('<response><result>9999</result><desc>INVALID SIGN</desc></response>')

            items = root.find('body').findall('item')

            for item in items:
                up_order_id = item.find('orderId').text
                result = item.find('result').text
                desc = item.find('desc').text

                if not self.master.sismember('list:create', 'Q20' + up_order_id):
                    request_log.error('ORDER IS BACK ALREADY', extra={'orderid': 'Q20' + up_order_id})
                    continue

                handler = XichengSingleHandler(self.application, self.request)
                yield handler.by_order(up_order_id, result, desc)

        except Exception as e:
            request_log.exception('CALLBACK FAIL %s', self.request.body)


class XichengSingleHandler(CoreHandler):
    @tornado.gen.coroutine
    def by_order(self, up_order_id, result, desc=None):
        master = self.master
        try:
            order_id = 'Q20' + up_order_id
            self.up_back_result = result
            if result != '1003' or not desc:
                self.back_result = RESULT_MAP.get(result, "9")
            else:
                if '欠费' in desc:
                    self.back_result = 10020
                elif '停机' in desc:
                    self.back_result = 10020
                elif '状态' in desc and '用户' in desc:
                    self.back_result = 10111
                elif '互斥' in desc:
                    self.back_result = 10019
                else:
                    self.back_result = 9

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
