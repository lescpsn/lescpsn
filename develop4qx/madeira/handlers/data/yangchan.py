import logging
import time
import xml.etree.ElementTree as et

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from handlers import signature


h = {'Content-Type': 'application/x-www-form-urlencoded'}

request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    1: 0
}


@tornado.gen.coroutine
def up_yangchan(self, partner):
    prod = self.slave.hmget('private:yangchan:{carrier}:{price}'.format(carrier=self.carrier, price=self.price),
                            ['flow', 'range', 'start', 'effect', 'net'])
    flow_value = prod[0]
    range = prod[1]
    start = prod[2]
    effect = prod[3]
    net = prod[4]

    self.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", self.up_req_time)

    sign = partner['user_id'] + self.mobile + str(self.price) + flow_value + range + start
    sign = signature(signature(sign).lower() + partner['secret']).lower()

    body = '&'.join(['user_id=' + partner['user_id'],
                     'phone=' + self.mobile,
                     'money=' + str(self.price),
                     'flowValue=' + flow_value,
                     'range=' + range,
                     'effectStartTime=' + start,
                     'effectTime=' + effect,
                     'netType=' + net,
                     'verification=' + sign,
                     'order_id=' + self.order_id])

    url = partner['url.order']

    request_log.info('CALL_REQ %s %s', url, body, extra={'orderid': self.order_id})

    response = None
    result = 99999
    # call & wait
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body)
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': self.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': self.order_id})
    finally:
        http_client.close()

    if response and response.code == 200:
        body = response.body.decode()
        request_log.info('CALL_RESP %s', body, extra={'orderid': self.order_id})

        try:
            root = et.fromstring(body)
            result = int(root.find('code').text)
            # self.up_order_id = resp['request_no']
            # self.up_cost = self.cost
        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': self.order_id})

    # result mapping
    result = RESULT_MAPPING.get(result, result)

    self.up_result = result
    self.up_resp_time = time.localtime()  # <--------------

    return result
