import json
import logging
from tornado.httpclient import AsyncHTTPClient, HTTPError
import xml.etree.ElementTree as ET
import time
import tornado.gen

from handlers.core import CoreHandler
from handlers import signature

request_log = logging.getLogger("madeira.request")

QUERY_MAPPING = {
    0: 0,
    1: 1,
    2: 0,
    5: 0,
    -2: 9,
}


class CallbackLegendHandler(CoreHandler):
    @tornado.gen.coroutine
    def get(self):

        master = self.master

        route = self.get_argument('r', 'legend')
        order_id = self.get_argument('o')

        if not master.sismember('list:create', order_id):
            request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
            return

        request_log.info('LEGEND QUERY BACK %s' % self.request.uri, extra={'orderid': order_id})

        partner = self.application.config['upstream'][route]

        did = partner['did']
        key = partner['key']

        tsp = int(time.mktime(time.localtime()))

        mobile = master.hget('order:' + order_id, 'mobile')

        if mobile is None:
            self.send_error(403)
            return

        # tel+did+ timestamp+key
        userkey = signature(mobile, did, str(tsp), key)

        q = 'tel={tel}&did={did}&dorderid={dorderid}&timestamp={timestamp}&userkey={userkey}'.format(
                tel=mobile, did=did, dorderid=order_id, timestamp=tsp, userkey=userkey)

        url = partner['url.query'] + '?' + q

        result = 0
        http_client = AsyncHTTPClient()

        try:
            response = yield http_client.fetch(url, method='GET')

            body = response.body.decode()
            request_log.info('QUERY_RESP %s', body, extra={'orderid': order_id})

            resp = json.loads(body)

            status = resp['status']
            result = QUERY_MAPPING.get(status, 0)

        except HTTPError as http_error:
            request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
        except Exception as e:
            request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': order_id})
        finally:
            http_client.close()

        if result not in [1, 9]:
            request_log.info('LEGEND NOT RETURN %s', result, extra={'orderid': order_id})
            self.finish('processing')
            return

        try:
            self.up_back_result = str(result)

            stage = self.restore_order(order_id)

            # checking callback
            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            self.send_error(500)
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()

        self.finish('success')

    @tornado.gen.coroutine
    def post(self):

        master = self.master

        order_id = None
        status = None

        # {"did":"123456","dorderid":"123456","status":1,"msg":"订购成功"}

        tsp = int(time.mktime(time.localtime()))

        try:
            body = self.request.body.decode()
            obj = json.loads(body)

            order_id = obj.get('dorderid')
            status = obj.get('status')

            request_log.info('LEGEND BACK %s', body, extra={'orderid': order_id})

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            if status == 1:
                self.up_back_result = '1'
            elif status == 2:
                self.up_back_result = '9'
            else:
                request_log.error('INVALID STATUS %s', status, extra={'orderid': order_id})
                return

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
                'plat_offer_id',  # 9
                'master_id',  # 10
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

            self.plat_offer_id = order_info[9]
            self.master_id = order_info[10]

            self.route = master.hget('order:' + order_id, 'route/%d' % stage)

            self.product = 'data'
            # checking callback
            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: status,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.exception('restore order info error %s', self.request.body, extra={'orderid': order_id})
            self.send_error(500)
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()

        self.finish('success')
