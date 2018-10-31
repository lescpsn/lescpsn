# 索派接口
import json
import logging
import time
from urllib.parse import urlencode

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

request_log = logging.getLogger("madeira.request")
RESULT_MAP = {
    'true': 0,  # 成功
    'false': 9,  # 失败

}


@tornado.gen.coroutine
def up_suopai(handler, partner):
    handler.up_req_time = time.localtime()
    userNo = partner['userNo']
    userKey = partner['userKey']
    mobile = handler.mobile
    orderId = handler.order_id

    k = 'private:suopai:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    productNo = handler.slave.get(k)

    if productNo is None:
        handler.up_result = 5003
        return handler.up_result

    body = {
        "userNo": userNo,
        "userKey": userKey,
        "mobile": mobile,
        "productNo": productNo,
        "orderId": orderId,
    }
    url = partner['url.order']
    requ_body = urlencode(body)
    url = url + '?' + requ_body

    result = 9999

    http_client = AsyncHTTPClient()

    try:
        request_log.info("SUOPAI REQ %s", requ_body, extra={'orderid': handler.order_id})

        response = yield http_client.fetch(url, method='GET', request_timeout=120)

    except HTTPError as http_error:
        request_log.error('SUOPAI CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('SUOPAI CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    # 订单超时处理
    if result == 60599:
        jobId = yield query_jobid(handler, partner)

        if jobId is None:
            result = 9
        else:
            response = yield query_order_by_jobid(handler, partner, jobId)

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            up_result = response_body.get('success')
            sp_order_id = response_body.get("jobId")
            handler.up_order_id = sp_order_id

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

            if handler.up_result == 'true':
                handler.master.set("map:suopai:{sp_order_id}".format(sp_order_id=sp_order_id), handler.order_id)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result


@tornado.gen.coroutine
def query_jobid(handler, partner):
    userNo = partner['userNo']
    userKey = partner['userKey']
    orderId = handler.order_id

    body = {
        "userNo": userNo,
        "userKey": userKey,
        "orderId": orderId,
    }
    url = partner['url.query1']
    requ_body2 = urlencode(body)
    url = url + '?' + requ_body2

    response = None
    http_client = AsyncHTTPClient()
    try:
        request_log.info("SUOPAI QUERY REQ %s", requ_body2, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='GET', request_timeout=120)

    except HTTPError as http_error:
        request_log.error('SUOPAI QUERY CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('SUOPAI QUERY CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    jobId = None
    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        response_body = json.loads(response_body)
        jobId = response_body.get("jobId")

        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})

    return jobId


@tornado.gen.coroutine
def query_order_by_jobid(handler, partner, jobId):
    userNo = partner['userNo']
    userKey = partner['userKey']

    query_body = {
        "userNo": userNo,
        "userKey": userKey,
        "jobId": jobId,
    }
    url = partner['url.query2']
    request_body = urlencode(query_body)
    url = url + '?' + request_body

    http_client = AsyncHTTPClient()

    try:
        request_log.info("SUOPAI REQ %s", request_body, extra={'orderid': handler.order_id})

        response = yield http_client.fetch(url, method='GET', request_timeout=120)

    except HTTPError as http_error:
        request_log.error('SUOPAI CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        # result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('SUOPAI CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None

    finally:
        http_client.close()

    return response
