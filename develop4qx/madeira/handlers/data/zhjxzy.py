# 信之源接口
import json
import logging
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError, HTTPClient

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': 0,  # 成功
    '-1': 9,  # 账号、密码错误
    '-2': 9,  # 手机号码为空或者手机号码错误
    '-3': 9,  # 认证错误
    '-4': 9,  # 产品不存在
    '-5': 9,  # IP限制
    '-6': 9,  # 余额不足
    '-7': 9,  # 服务商网关能力不足或余额不足
    '-8': 9,  # 失败
    '-9': 9,  # 接口暂停服务
    '-100': 9,  # 其它异常
}


@tornado.gen.coroutine
def up_zhjxzy(handler, partner):
    handler.up_req_time = time.localtime()

    timestamp = int(time.time())
    account = partner["account"]
    password = partner["password"]
    mobile = handler.mobile

    productId = None
    k = 'private:zhjxzy:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    productId = handler.slave.get(k)

    if productId is None:
        handler.up_result = 5003
        return handler.up_result

    sign = to_md5(account + to_md5(password) + str(timestamp) + mobile + productId)

    body = {
        "account": account,
        "timestamp": timestamp,
        "mobile": mobile,
        "productId": productId,
        "sign": sign
    }
    body = json.dumps(body)

    url = partner["url_busi"]
    h = {'Content-Type': 'application/json;charset=UTF-8'}

    result = 9999
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)

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
            status = response_body.get("status")

            result = RESULT_MAP.get(status, 9)

            if result == 0:
                handler.up_order_id = response_body.get("data")

            if handler.up_order_id:
                # expire in 10 days
                handler.master.setex('map:xzy:%s' % handler.up_order_id, 864000, handler.order_id)

            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result


def up_prod():
    timestamp = int(time.time())
    account = 'xzy039'
    password = 'FRK56hdu'
    carrier = 'cmcc'
    sign = to_md5(account + to_md5(password) + str(timestamp) + carrier)

    body = {
        "account": account,
        "timestamp": timestamp,
        "sign": sign,
        "carrier": carrier
    }

    body = json.dumps(body)
    url = "http://api.zhjxzy.com/flowProduct"

    http_client = HTTPClient()
    resp = http_client.fetch(url, method='POST', body=body)
    if resp.code == 200:
        print(resp.body.decode())


if __name__ == '__main__':
    up_prod()
