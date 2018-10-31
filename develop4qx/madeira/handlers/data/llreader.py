# 上海琅琅接口
import logging
import json
from urllib.parse import urlencode
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import md5_signature


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '1000': 0,  # 成功
    '1001': 9,  # 非法渠道参数cpId
    '1003': 9,  # 订单号超过32位
    '1004': 9,  # 非法流量面值参数flow
    '1005': 9,  # 无此cpId
    '1007': 9,  # 签名不一致
    '1008': 9,  # 重复的订单请求
    '1011': 9,  # 系统异常
    '1012': 9,  # 无相应流量产品
    '1013': 9,  # 余额不足
    '1014': 9,  # 扣款异常
    '1016': 9,  # 调用充值接口失败
    '1100': 9,  # 其它原因受理失败
}


@tornado.gen.coroutine
def up_llreader(handler, partner):
    handler.up_req_time = time.localtime()

    cpId = partner["cpid"]
    phone = handler.mobile
    key = partner["key"]
    orderNo = handler.order_id

    flow = None
    k = 'private:llreader:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    flow = handler.slave.get(k)

    if flow is None:
        handler.up_result = 5003
        return handler.up_result

    sign = cpId + flow + orderNo + phone + key
    sign = md5_signature(sign)

    body = {
        "cpId": cpId,
        "orderNo": orderNo,
        "flow": flow,
        "phone": phone,
        "type": '1',
        "sign": sign,
    }

    body = urlencode(body)

    url = partner["url_busi"]

    result = 9999

    try:
        http_client = AsyncHTTPClient()
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)

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
            handler.up_order_id = response_body["data"]["orderNo"]

            resp_code = response_body["status"]
            result = RESULT_MAP.get(resp_code, 9)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.exception('PARSE UPSTREAM', extra={'orderid': handler.order_id})
    return result