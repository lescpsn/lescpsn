# 中琛源接口
import json
import logging
import time
from urllib.parse import urlencode

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")
RESULT_MAP = {
    '100': 0,  # 执行成功
    '205': 9,  # 用户名或者密码不正确
    '203': 9,  # 没有接入权限
    '105': 9,  # 执行失败
    '102': 9,  # 参数格式不正确
    '108': 9,  # 手机号码不支持充值
    '121': 9,  # 充值通道已关闭
    '122': 9,  # 运营商系统维护，请稍后再试
}


@tornado.gen.coroutine
def up_ibumobile2(handler, partner):
    handler.up_req_time = time.localtime()
    orderNo = handler.order_id
    mobile = handler.mobile
    userName = partner['userName']
    userPwd = to_md5(partner['userPwd'])
    bcallbackUrl = partner['bcallbackUrl']
    f = partner['f']
    flowType = partner['flowType']
    interfaceSign = partner['interfaceSign']

    k = 'private:zhongshenyuan:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    proKey = handler.slave.get(k)

    if proKey is None:
        handler.up_result = 5003
        return handler.up_result

    data = 'userName=' + userName + '&userPwd=' + userPwd + interfaceSign + '&mobile=' + mobile + '&proKey=' + proKey + '&orderNo=' + orderNo + '&bcallbackUrl=' + bcallbackUrl
    # print('DATA:', data)

    sign = to_md5(data)
    # print("SIGN:", sign)

    body = {
        "orderNo": orderNo,
        "mobile": mobile,
        "userName": userName,
        "userPwd": userPwd,
        "proKey": proKey,
        "bcallbackUrl": bcallbackUrl,
        "sign": sign,
        "f": f,
        "flowType": flowType,
    }
    body = urlencode(body)
    url = partner['url.order']
    url = url + '?' + body

    result = 9999

    http_client = AsyncHTTPClient()

    try:
        request_log.info("IBUMOBILE REQ %s", body, extra={'orderid': handler.order_id})

        response = yield http_client.fetch(url, method='POST', body='', request_timeout=120)

    except HTTPError as http_error:
        request_log.error('IBUMOBILE CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('IBUMOBILE CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            up_result = response_body.get('code')
            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
