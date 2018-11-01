# 流量星接口
import logging
import re
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': 0,  # 充值请求提交成功,
    '-1': 9,  #用户名或密码错误,
    '-2': 9,  #参数错误,
    '-3': 9,  #充值体格式错误,
    '-4': 9,  #IP不对,
    '-5': 9,  #系统异常,
    '-6': 9,  #已超过本月最大充值额度,
    '-7': 9,  #额度不足,
    '-8': 10111,  #用户被锁定,
    '-9': 9,  #流量包错误,
    '-10': 90005,  #手机号码错误,
}

ORDER_FORMAT = (
    'name={name}&password={password}&version=1.6&callbackURL={callbackURL}&body=<body>'
    '<message>'
    '<flow>{flow}</flow>'
    '<order>'
    '<mobile>{mobile}</mobile>'
    '<orderid>{orderid}</orderid>'
    '</order>'
    '</message>'
    '</body>'
)


@tornado.gen.coroutine
def up_idatafocus(handler, partner):
    handler.up_req_time = time.localtime()

    name = partner["user_id"]
    password = partner["password"]
    callbackURL = partner["callbackURL"]
    mobile = handler.mobile
    orderid = handler.order_id
    
    flow = None
    k = 'private:idatafocus:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    flow = handler.slave.get(k)

    if flow is None:
        handler.up_result = 5003
        return handler.up_result

    body = ORDER_FORMAT.format(name=name, password=password, mobile=mobile, flow=flow, callbackURL=callbackURL,
                               orderid=orderid)

    url = partner["url_busi"]

    result = 9999
    up_result = None
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)

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
        response_body = response.body.decode()
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = ''.join(response_body.split())
            up_result = re.search(r'<code>(.*)</code>', response_body).groups()[0]

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result