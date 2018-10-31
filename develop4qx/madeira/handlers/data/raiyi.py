# coding=utf8
# 苏州瑞翼接口
import logging
import json
import time
from urllib.parse import quote

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5
from utils.szry import to_para


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': 0,  # 成功
    '0001': 9,  # 失败
    '1001': 9,  # 未知错误
    '1002': 9,  # 系统异常
    '1003': 9,  # 接口鉴权失败
    '2001': 9,  # 未知参数错误
    '2002': 9,  # 必填参数为空
    '2003': 9,  # 参数范围错误
}

CODE = "authAppkey={authAppkey}&authSign={authSign}&mobile={mobile}&notifyUrl={notifyUrl}&partnerOrderNo={partnerOrderNo}&productId={productId}&authTimespan={authTimespan}"


@tornado.gen.coroutine
def up_raiyi(handler, partner):
    handler.up_req_time = time.localtime()

    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    authAppkey = partner["authAppkey"]
    appsecret = partner["appsecret"]
    notifyUrl = partner["notifyUrl"]

    mobile = handler.mobile
    mobile = to_para(mobile).decode()
    partnerOrderNo = handler.order_id

    productId = None
    k = 'private:raiyi:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    productId = handler.slave.get(k)

    if productId is None:
        handler.up_result = 5003
        return handler.up_result

    data = authAppkey + 'authTimespan' + '=' + timestamp + 'mobile' + '=' + mobile + 'notifyUrl' + '=' + notifyUrl + 'partnerOrderNo' + '=' + partnerOrderNo + 'productId' + '=' + productId + appsecret
    authSign = to_md5(data)

    mobile1 = quote(mobile)
    body = CODE.format(
        authTimespan=timestamp,
        authSign=authSign,
        authAppkey=authAppkey,
        notifyUrl=notifyUrl,
        productId=productId,
        partnerOrderNo=partnerOrderNo,
        mobile=mobile1
    )
    url = partner["url_busi"]
    url = url + '?' + body

    result = 9999

    try:
        http_client = AsyncHTTPClient()
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='GET', request_timeout=120)

    except HTTPError as http_error:
        request_log.exception('CALL UPSTREAM FAIL', extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        return result

    except Exception as e:
        request_log.exception('CALL UPSTREAM FAIL', extra={'orderid': handler.order_id})
        response = None

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            if 'data' in response_body:
                if response_body['data']:
                    handler.up_order_id = response_body["data"]["orderNo"]

            resp_code = response_body["code"]
            result = RESULT_MAP.get(resp_code, 9)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.exception('PARSE UPSTREAM', extra={'orderid': handler.order_id})
    return result