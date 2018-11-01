import json
import logging
import time
import urllib.parse

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError
from handlers import signature


h = {'Content-Type': 'text/xml'}

request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    1000: 0
}


@tornado.gen.coroutine
def up_seek(handler, partner):
    slave = handler.slave

    # private data
    if handler.scope is None:
        k = 'private:seek:{area}:{price}'.format(area=handler.area, price=handler.price)
    else:
        k = 'private:seek:{area}:{price}:{scope}'.format(area=handler.area, price=handler.price, scope=handler.scope)

    prod = slave.hmget(k, ['prod_id', 'sum'])

    if prod[0] is None:
        return 99999

    prod_id = prod[0]
    prod_sum = prod[1]

    handler.up_req_time = time.localtime()
    tsp = int(time.mktime(handler.up_req_time))

    back_url = urllib.parse.quote_plus(partner['callback'])

    sign = ''.join(['appkey', partner['key'],
                    'channelOrderNo', handler.order_id,
                    'customer', handler.mobile,
                    'notifyUrl', back_url,
                    'prodId', prod_id,
                    'prodNum1prodPayType0',
                    'sum', prod_sum,
                    'timestamp', str(tsp),
                    partner['secret']])

    sign = signature(sign).lower()

    q = '&'.join(['appkey=' + partner['key'],
                  'prodId=' + prod_id,
                  'customer=' + handler.mobile,
                  'sum=' + prod_sum,
                  'prodNum=1',
                  'prodPayType=0',
                  'channelOrderNo=' + handler.order_id,
                  'notifyUrl=' + back_url,
                  'timestamp=' + str(tsp),
                  'sign=' + sign])

    url = partner['url.order']

    # print(handler.order_id + ":" + body)
    full_url = url + '/r/Channel/createOrder?' + q
    request_log.info('CALL_REQ %s', full_url, extra={'orderid': handler.order_id})

    response = None
    result = 99999
    # call & wait
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(full_url, method='GET')
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    if response and response.code == 200:
        body = response.body.decode('utf8')
        request_log.info('CALL_RESP1 %s', body, extra={'orderid': handler.order_id})

        try:
            # {"orderNo":"1418189340100004","orderStatus":0,"createOrderTime":"20141210132900","resultCode":"1000","resultReason":""}
            resp = json.loads(body)
            result = int(resp['resultCode'])
            if result == 1000:
                handler.up_order_id = resp['orderNo']
        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if result == 1000 and handler.up_order_id:
        # SUBMIT
        tsp = int(time.mktime(handler.up_req_time))
        sign = ''.join(['appkey' + partner['key'],
                        'orderNo' + handler.up_order_id,
                        'timestamp' + str(tsp),
                        partner['secret']])

        sign = signature(sign).lower()

        q = '&'.join(['orderNo=' + handler.up_order_id,
                      'appkey=' + partner['key'],
                      'timestamp=' + str(tsp),
                      'sign=' + sign])

        full_url = url + '/r/Channel/submitOrder?' + q

        response = None
        result = 99999
        # call & wait
        http_client = AsyncHTTPClient()
        try:
            response = yield http_client.fetch(full_url, method='GET')
        except HTTPError as http_error:
            request_log.error('CALL UPSTREAM2 FAIL %s', http_error, extra={'orderid': handler.order_id})
            result = 60000 + http_error.code
        except Exception as e:
            request_log.error('CALL UPSTREAM2 FAIL %s', e, extra={'orderid': handler.order_id})
        finally:
            http_client.close()

        if response and response.code == 200:
            body = response.body.decode('utf8')
            request_log.info('CALL_RESP2 %s', body, extra={'orderid': handler.order_id})

            try:
                # {"orderNo":"1418189340100004","orderStatus":0,"createOrderTime":"20141210132900","resultCode":"1000","resultReason":""}
                resp = json.loads(body)
                result = int(resp['resultCode'])
            except Exception as e:
                result = 99999
                request_log.error('PARSE UPSTREAM2 %s', e, extra={'orderid': handler.order_id})

    # result mapping
    result = RESULT_MAPPING.get(result, result)

    handler.up_result = result
    handler.up_resp_time = time.localtime()  # <--------------

    return result
