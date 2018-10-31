# encoding=utf8
# 裕诚接口
import base64
import json
import logging
import time
from datetime import datetime

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': 0,  # 成功
    '-1': 0,  # 待处理
}


@tornado.gen.coroutine
def up_yucheng(handler, partner):
    handler.up_req_time = time.localtime()
    master = handler.master

    key = "auth:yucheng:token"
    token = master.get(key)
    if token is None:
        token = yield access_token(handler, partner)

    if token is None:
        handler.up_result = 5003
        return handler.up_result

    spid = partner["spid"]
    access_key = partner["access_key"]
    authorization = spid + ":" + access_key
    authorization = base64.b64encode(authorization.encode()).decode()
    h = {
        "ContentType": 'application/json; charset=utf-8',
        "User-Agent": 'web',
        "Authorization": authorization,
        "DeviceToken": token,
    }
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    seqid = handler.order_id
    mobile = handler.mobile
    efftype = partner["efftype"]
    model = partner["model"]

    flowsize = None
    k = 'private:yucheng:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    flowsize = handler.slave.get(k)

    if flowsize is None:
        handler.up_result = 5003
        return handler.up_result

    body = {
        "func": 'EC0001_POOL',
        "appcode": 'YC001',
        "timestamp": timestamp,
        "checkcode": timestamp,
        "seqid": seqid,
        "paralist": {
            "mobile": mobile,
            "flowsize": flowsize,
            "efftype": efftype,
            "model": model,
        }
    }
    body = json.dumps(body)
    url = partner['url.order']

    result = 9999
    up_result = None
    http_client = AsyncHTTPClient()
    try:
        request_log.info("YUCHENG REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)

    except HTTPError as http_error:
        request_log.error('CALL YUCHENG UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        response = None

    except Exception as e:
        request_log.exception('CALL YUCHENG UPSTREAM FAIL', extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("YUCHENG RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            body = json.loads(response_body)
            up_result = body["item"]["resultcode"]

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result


# 获取安全访问令牌（每小时获取一次）
@tornado.gen.coroutine
def access_token(handler, partner, n=1):
    spid = partner["spid"]
    access_key = partner["access_key"]
    authorization = spid + ":" + access_key
    authorization = base64.b64encode(authorization.encode()).decode()

    h = {
        "ContentType": 'application/json; charset=utf-8',
        "User-Agent": 'web',
        "Authorization": authorization,
        "DeviceToken": '',
    }

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    seqid = handler.order_id

    body = {
        "func": 'web_access_token',
        "appcode": 'YC001',
        "timestamp": timestamp,
        "checkcode": timestamp,
        "seqid": seqid,
        "paralist": {
            "01": spid,
            "02": access_key
        }
    }
    body = json.dumps(body)
    url = partner["url.order"]

    response = None
    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)
    except Exception as e:
        request_log.exception('YUCHENG TOKEN FAIL', extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    token = None
    if response and response.code == 200:
        body = response.body.decode('utf8')
        body = json.loads(body)
        request_log.info("UPSTREAM RESP" + str(body), extra={'orderid': handler.order_id})

        status = int(body["status"])
        error_list = list(range(400, 411))
        if status in error_list and n < 3:
            yield access_token(handler, partner, n + 1)
        else:
            token = body["item"]["token"]

        master = handler.master
        key = "auth:yucheng:token"
        master.setex(key, 3600, token)
        request_log.info("TOKEN:" + token, extra={'orderid': handler.order_id})

    return token
