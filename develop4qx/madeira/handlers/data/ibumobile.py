# 中深源接口
import json
import logging
from urllib.parse import urlencode
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '00': 1,  # 充值成功
    '-99999': 9,  # 充值失败
    '100': 0,  # 充值中
    '106': 9,  # 未找到数据
    '205': 9,  # 用户名或者密码不正确
    '108': 9,  # 手机号码不支持充值
    '102': 9,  # 参数格式不正确
    '203': 9,  # 没有接入权限
}


@tornado.gen.coroutine
def up_ibumobile(handler, partner):
    handler.up_req_time = time.localtime()

    orderNo = handler.order_id
    userName = partner["userName"]
    userPwd = to_md5(partner["userPwd"])
    bcallbackUrl = partner["bcallbackUrl"]
    mobile = handler.mobile

    proKey = None
    k = 'private:ibumobile:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    proKey = handler.slave.get(k)

    if proKey is None:
        handler.up_result = 5003
        return handler.up_result

    data = "userName=" + userName + "&userPwd=" + userPwd + "&mobile=" + mobile + "&proKey=" + proKey + "&orderNo=" + orderNo + "&bcallbackUrl=" + bcallbackUrl
    sign = to_md5(data)

    body = {
        "orderNo": orderNo,
        "mobile": mobile,
        "userName": userName,
        "userPwd": userPwd,
        "proKey": proKey,
        "bcallbackUrl": bcallbackUrl,
        "sign": sign
    }

    body = urlencode(body)

    url = partner["url_busi"]
    url = url + '?' + body

    result = 9999
    up_result = None
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
            up_result = response_body["code"]

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
