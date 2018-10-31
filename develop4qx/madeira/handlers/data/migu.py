import codecs
import hashlib
import json
import logging
import time
from urllib.parse import urlencode
import uuid

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError, HTTPRequest, HTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    '00000': 1,
    '00001': 1,

    '10000': 9,
    '10001': 9,
    '10002': 9,
    '10008': 9,
    '10009': 9,
    '01557008': 9,
    '01551201': 9,
    '01557301': 9,
    '01557203': 9,
    '01557201': 9,
    '01557013': 9,
    '01557330': 9,
    '01557331': 9,
}

@tornado.gen.coroutine
def up_migu(handler, partner):
    #redis-cli -n 1 set private:migu:10 83
    buss_id = handler.slave.get('private:migu:%d' % handler.price)

    if buss_id is None:
        handler.up_resp_time = time.localtime()
        handler.up_result = 5003
        return handler.up_result



    requ_data = {
        'identify': partner['identify'],
        'phone': handler.mobile,
        'busid': buss_id,
    }
    requ_data = urlencode(requ_data)
    request_log.info('authsubapi REQU {0}'.format(requ_data), extra={'orderid': handler.order_id})
    request = HTTPRequest(url=partner['url.authsubapi']+'?'+requ_data, method='GET', request_timeout=120)
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(request)
        request_log.info('authsubapi RESP {0}'.format(response.body.decode()), extra={'orderid': handler.order_id})
    except:
        request_log.exception('CALL UPSTREAM FAIL %s', extra={'orderid': handler.order_id})




    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)
    order_id = tsp + '000' + handler.order_id[-3:]

    handler.up_order_id = order_id

    orderform = uuid.uuid1().hex

    requ_data = {
        'recommentphone': partner['recommentphone'],
        'identify':partner['identify'],
        'phone': handler.mobile,
        'busid': buss_id,
        'orderform': orderform,
    }
    requ_data = urlencode(requ_data)

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', requ_data, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    result = 99999

    request = HTTPRequest(url=partner['url.order']+'?'+requ_data, method='GET', request_timeout=120)
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(request)

    except HTTPError as http_error:
        request_log.exception('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code

    except Exception as e:
        request_log.exception('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})


    handler.up_resp_time = time.localtime()  # <--------------

    result_code = '60000'
    if response and response.code == 200:
        #去掉BOM头部
        if response.body[:3] == codecs.BOM_UTF8:
            body = response.body[3:]
        else:
            body = response.body
        body = body.decode()

        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            resp = json.loads(body)
            result_code = resp.get('code')
            handler.up_result = resp['resultStatus']

        except Exception as e:
            result = 99999
            request_log.exception('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result


    if result_code == '0':
        result = 0
        handler.master.set('map:migu:%s' % orderform, handler.order_id)
    else:
        result = 9

    return  result