import json
import logging
import hashlib

import tornado
import tornado.web
import tornado.gen
from tornado.httpclient import AsyncHTTPClient


SECRET_MAPPING = {'6da2681d45058b8b': '6c41a870b54abb78efc9874475612345'}

request_log = logging.getLogger("madeira.request")


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        # if type(p) is str:
        m.update(p.encode('utf8'))
        # else:
        # m.update(p)
    return m.hexdigest()


class SeekHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, path):
        if path == 'createOrder':
            yield self.create_order()
        elif path == 'submitOrder':
            yield self.sumbit_order()

    @tornado.gen.coroutine
    def create_order(self):
        master3 = self.application.sentinel.master_for('madeira', db=3)

        app_key = self.get_argument('appkey')
        channel_order_no = self.get_argument('channelOrderNo')
        customer = self.get_argument('customer')
        notify_url = self.get_argument('notifyUrl')
        prod_id = self.get_argument('prodId')
        prod_num = self.get_argument('prodNum')
        prod_pay_type = self.get_argument('prodPayType')
        sum = self.get_argument('sum')
        timestamp = self.get_argument('timestamp')
        sign = self.get_argument('sign')

        secret = SECRET_MAPPING.get(app_key)
        # check sign
        sign2 = ''.join(['appkey', app_key,
                         'channelOrderNo', channel_order_no,
                         'customer', customer,
                         'notifyUrl', notify_url,
                         'prodId', prod_id,
                         'prodNum', prod_num,
                         'prodPayType', prod_pay_type,
                         'sum', sum,
                         'timestamp', timestamp,
                         secret])
        sign2 = signature(sign2)

        request_log.info('SIGN %s %s', sign, sign2)

        seek_id = '%010d' % master3.incrby('uid')

        self.finish(json.dumps({'resultCode': '1000',
                                'resultReason': '',
                                'orderNo': seek_id,
                                'orderStatus': 0,
                                'createOrderTime': '', }))

    @tornado.gen.coroutine
    def sumbit_order(self):
        master3 = self.application.sentinel.master_for('madeira', db=3)

        app_key = self.get_argument('appkey')
        order_no = self.get_argument('orderNo')
        timestamp = self.get_argument('timestamp')
        sign = self.get_argument('sign')

        secret = SECRET_MAPPING.get(app_key)

        sign2 = ''.join(['appkey', app_key,
                         'order_no', order_no,
                         'timestamp', timestamp,
                         secret])
        sign2 = signature(sign2)

        request_log.info('SIGN %s %s', sign, sign2)

        self.finish(json.dumps({'resultCode': '1000',
                                'resultReason': '',
                                'orderNo': order_no,
                                'orderStatus': 1,
                                'createOrderTime': '', }))


def seek_callback(request_no, result):
    body = json.dumps({'request_no': request_no, 'result_code': result})

    print('CALLBACK - %s' % body)

    http_client = AsyncHTTPClient()
    try:
        http_client.fetch('http://localhost:8899/data/callback', method='POST', body=body)
    except Exception as e:
        print(e)
    finally:
        http_client.close()
