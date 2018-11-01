# 5A接口
import json
import logging
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    0: 0,  # 成功
    1: 9,  # 没有这个用户账户
    2: 9,  # 用户账户不可用
    3: 9,  # 用户账户无权限
    4: 9,  # 用户账户余额不足
    21: 9,  # 请求数据校验失败
    22: 9,  # 提交的数据格式错误
    23: 9,  # 没有可用产品
    24: 9,  # 提交数据的时间戳不正确
    999: 9,  # 位置错误
}


@tornado.gen.coroutine
def up_faliuliang2(handler, partner):
    handler.up_req_time = time.localtime()

    username = partner["username"]
    mobiles = handler.mobile
    key = partner["key"]
    tradeNo = handler.order_id
    timestamp = int(time.time() * 1000)
    url = partner["back_url"] + "?"

    spec = None
    k = 'private:faliuliang2:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    spec = handler.slave.get(k)

    if spec is None:
        handler.up_result = 5003
        return handler.up_result

    signature = to_md5(str(timestamp) + tradeNo + mobiles + spec + url + key)

    body = {
        "areaType": "c",
        "effectiveType": "tm",
        "mobiles": mobiles,
        "signature": signature,
        "spec": spec,
        "timestamp": int(timestamp),
        "tradeNo": tradeNo,
        "username": username,
        "url": url
    }
    body = json.dumps(body)

    url = partner["url_busi"]

    headers = {'Content-Type': 'application/json;charset=UTF-8'}

    result = 9999
    up_result = None
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', body=body, headers=headers, request_timeout=120)

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
            up_result = response_body["code"]

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result
