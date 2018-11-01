# 云流接口
import json
import logging
from urllib.parse import urlencode
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    0: 0,  # 成功
    99: 9,  # 失败
}


@tornado.gen.coroutine
def up_yflow(handler, partner):
    handler.up_req_time = time.localtime()

    confId = partner["confId"]
    callback = partner["callback"]
    apikey = partner["apikey"]
    mobile = handler.mobile
    seqNo = handler.order_id
    t = int(time.time())

    data = apikey + str(confId) + mobile + str(t)
    sign = to_md5(data)

    flow = None
    k = 'private:yflow:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    flow = handler.slave.get(k)

    flow = int(flow)

    if flow is None:
        handler.up_result = 5003
        return handler.up_result

    body = {
        "confId": confId,
        "mobile": mobile,
        "flow": flow,
        "callback": callback,
        "t": t,
        "sign": sign,
        "seqNo": seqNo,
    }
    body = urlencode(body)

    url = partner["url_busi"]
    url = url + '?' + body

    result = 9999
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='GET', request_timeout=120)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            retCode = response_body["retCode"]

            result = RESULT_MAP.get(retCode, 9)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result