import hashlib
import json
import logging
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    '0': 1,
    '1': 0,
    '2': 9,
    '3': 9,
    '4': 9,
    '5': 9,
    '6': 9,
    '7': 9,
    '8': 9,
    '9': 9,
    '10': 9,
    '11': 9,
    '12': 9,
    '13': 9,
    '14': 9,
    '15': 9,
    '16': 9,
    '17': 9,
}

QUERY_MAPPING = {
    '0': 1,
    '1': 9,
    '2': 9,
    '3': 0,
    '-1': 0,
}


def wo_key(plain):
    m = hashlib.md5()
    m.update(plain.encode('utf8'))
    bs = m.digest()

    hex_str = '9014g2a5p6lu783e'
    token = ''
    for b in bs:
        token += hex_str[b >> 4 & 0xF]
        token += hex_str[b & 0xF]

    return token


@tornado.gen.coroutine
def up_wo(handler, partner):
    product_info = handler.slave.hmget('private:wo:%s:%d' % (handler.area, handler.price), ['product_id', 'price'])
    product_id = product_info[0]
    price = product_info[1]
    activity_id = partner['activity_id']

    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)
    order_id = tsp + '000' + handler.order_id[-3:]

    handler.up_order_id = order_id

    # key+orderNo+phoneNum+productId+ activityId+realPrice)
    token = wo_key(partner['key'] + order_id + handler.mobile + product_id + activity_id + price)

    query = ('orderNo={order_id}&productId={product_id}&activityId={activity_id}'
             '&phoneNum={mobile}&realPrice={price}&token={token}').format(
        order_id=order_id,
        product_id=product_id,
        activity_id=activity_id,
        mobile=handler.mobile,
        price=price,
        token=token)

    url = partner['url.order'] + '?' + query

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', query, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    result = 99999

    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='GET')
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode('utf8')
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            resp = json.loads(body)
            status = resp['status']

            result = RESULT_MAPPING.get(status, status)
            handler.up_result = result

        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    if result in [0, 60599]:
        for _ in range(5):
            result = yield query_order(order_id, partner)
            if result in [1, 9]:
                break

            # wait
            yield tornado.gen.Task(IOLoop.instance().add_timeout, time.time() + 120)

    if result == 1:
        yield handler.callback('1')
    elif result == 9:
        pass

    return result


@tornado.gen.coroutine
def query_order(order_id, partner):
    result = 0

    url = partner['url.query'] + '?orderNo=' + order_id

    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, method='GET')

        body = response.body.decode()
        request_log.info('QUERY_RESP %s', body, extra={'orderid': order_id})

        resp = json.loads(body)

        status = resp['status']
        result = QUERY_MAPPING.get(status, status)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': order_id})
    finally:
        http_client.close()

    return result