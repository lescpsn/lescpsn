# 流量风暴接口
import logging
import json
from urllib.parse import urlencode
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '00001': 0,  # 成功
    '00002': 9,  # 账户余额不足
    '00003': 9,  # 下单失败
    '00004': 9,  # 加密不匹配
    '00005': 9,  # 传递参数格式不正确
    '00006': 9,  # 充值成功
    '00007': 9,  # 充值进行中
    '00008': 9,  # 充值失败
    '00009': 9,  # 订单不存在
}


@tornado.gen.coroutine
def up_llfengbao(handler, partner):
    handler.up_req_time = time.localtime()

    timeStamp = time.strftime("%Y%m%d%H%M%S",time.localtime())
    trade_user = partner["trade_user"]
    user_key = partner["user_key"]
    trade_mobile = handler.mobile

    trade_order = handler.order_id

    trade_product = None
    k = 'private:llreader:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    trade_product = handler.slave.get(k)

    if trade_product is None:
        handler.up_result = 5003
        return handler.up_result

    data = trade_user+'-'+trade_order+'-'+trade_product+'-'+trade_mobile+'-'+user_key
    trade_passcode = to_md5(data)

    body = {
        'trade_user':trade_user,
        'trade_order':trade_order,
        'trade_product':trade_product,
        'trade_mobile':trade_mobile,
        'trade_passcode':trade_passcode,
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
            handler.up_order_id = response_body["trade_order"]

            resp_code = response_body["retinfo"]
            result = RESULT_MAP.get(resp_code, 0)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.exception('PARSE UPSTREAM', extra={'orderid': handler.order_id})
    return result