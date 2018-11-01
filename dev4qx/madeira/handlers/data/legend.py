import hashlib
import json
import logging
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError, HTTPClient
from tornado.ioloop import IOLoop
from handlers import signature

request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    '1': 1,
    '2': 0,
    '-3': 9,
    '-7': 9,
    '-2': 9,
    '-21': 9,
    '-22': 9,
    '-23': 9,
    '-101': 9,
    '-112': 9,
    '-113': 9,
    '-115': 9,
}

QUERY_MAPPING = {
    0: 0,
    1: 1,
    2: 0,
    5: 0,
    -2: 9,
}


@tornado.gen.coroutine
def up_legend(handler, partner):
    bid1 = handler.slave.get('private:legend:%s:%d' % (handler.carrier, handler.price))
    bid2 = handler.slave.get('private:legend:%s:%s:%d' % (handler.carrier, handler.area, handler.price))

    bid = bid2 or bid1
    did = partner['did']
    key = partner['key']

    handler.up_req_time = time.localtime()

    tsp = int(time.mktime(handler.up_req_time))

    handler.up_order_id = handler.order_id

    # tel+did+ timestamp+key
    userkey = signature(handler.mobile, did, str(tsp), key)

    query = ('tel={tel}&did={did}&bid={bid}&dorderid={dorderid}&timestamp={timestamp}&userkey={userkey}').format(
        tel=handler.mobile,
        did=did,
        bid=bid,
        dorderid=handler.order_id,
        timestamp=tsp,
        userkey=userkey)

    url = partner['url.order'] + '?' + query

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
        body = response.body.decode()
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            resp = json.loads(body)
            status = resp['status']

            result = RESULT_MAPPING.get(status, 0)
            handler.up_result = str(result)

        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    # if result in [0, 60599]:
    #     for i in range(2):
    #         # wait
    #         yield tornado.gen.Task(IOLoop.instance().add_timeout, time.time() + i * 60)
    #
    #         result = yield query_order(handler, partner)
    #         if result in [1, 9]:
    #             handler.up_result = str(result)
    #             break

    if result == 1:
        yield handler.callback('1')
    elif result == 9:
        pass
    elif result == 0:
        # handler.master.sadd('set:legend:pending', handler.order_id)
        request_log.info('LEGEND NOT_FINISHED', extra={'orderid': handler.order_id})
    return result


@tornado.gen.coroutine
def query_order(handler, partner):
    result = 0
    did = partner['did']
    key = partner['key']
    tsp = int(time.mktime(time.localtime()))
    # tel+did+ timestamp+key
    userkey = signature(handler.mobile, did, str(tsp), key)

    q = 'tel={tel}&did={did}&dorderid={dorderid}&timestamp={timestamp}&userkey={userkey}'.format(
        tel=handler.mobile, did=did, dorderid=handler.order_id, timestamp=tsp, userkey=userkey
    )

    url = partner['url.query'] + '?' + q

    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, method='GET')

        body = response.body.decode()
        request_log.info('QUERY_RESP %s', body, extra={'orderid': handler.order_id})

        resp = json.loads(body)

        status = resp['status']
        result = QUERY_MAPPING.get(status, 0)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    return result


def product_query():
    key = ''

    http_client = HTTPClient()

    t = time.localtime()
    tsp = int(time.mktime(t))
    x = '' + str(tsp) + key
    userkey = signature(x)

    print(tsp, userkey, x)

    url = 'http://cz.umeol.com:6090/dm/v/cz/getdp.do?spid=3&did=1687&timestamp={tsp}&userkey={userkey}'.format(
        tsp=tsp, userkey=userkey)

    print(url)

    try:
        response = http_client.fetch(url, method='GET')
        print(response.code, response.body.decode())

    # except HTTPError as http_error:
    #     # request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
    # except Exception as e:
    #     # request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': order_id})
    finally:
        http_client.close()


if __name__ == '__main__':
    # product_query()

    did = '1687'
    key = '674ZAHa5Z3h/MntVVAR'
    tsp = int(time.mktime(time.localtime()))
    # tel+did+ timestamp+key
    userkey = signature('18520311237', did, str(tsp), key)

    q = 'tel={tel}&did={did}&dorderid={dorderid}&timestamp={timestamp}&userkey={userkey}'.format(
        tel='18520311237', did=did, dorderid='Q2015072409372110811547', timestamp=tsp, userkey=userkey
    )

    url = 'http://cz.umeol.com:6090/dm/v/cz/qorder.do' + '?' + q

    http_client = HTTPClient()

    try:
        response = http_client.fetch(url, method='GET')

        body = response.body.decode()
        print(body)

    finally:
        http_client.close()
