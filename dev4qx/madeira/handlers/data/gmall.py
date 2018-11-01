# 极猫接口
import logging
from urllib.parse import urlencode
import time
import xml.etree.ElementTree as ET

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': 0,  # 成功
    '1': 9,  # 参数不合法
    '10': 9,  # 用户认证失败
    '11': 9,  # 或域名认证失败
    '12': 9,  # 余额不足，不能下发本次流量
    '13': 9,  # 无效流量网关类型
    '15': 9,  # 提交的手机号超量
    '20': 9,  # 提交参数不正确
    '21': 9,  # 签名错误
    '22': 9,  # 提交的号码为空
    '24': 9,  # 产品参数不正确
    '25': 9,  # 无该产品订购权限
    '26': 9,  # 无效的订单号
    '27': 9,  # 查询日期范围不能超过近三个月
    '29': 9,  # 请先关闭推送配置
    '30': 9,  # 调用过于频繁，请稍后再试
    '50': 9,  # 系统繁忙，稍后再试
}


@tornado.gen.coroutine
def up_gmall(handler, partner):
    handler.up_req_time = time.localtime()

    LoginName = partner["LoginName"]
    SendSim = handler.mobile
    Password = partner["Password"]
    OutTradeNo = handler.order_id

    ProCode = None
    k = 'private:gmall:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    ProCode = handler.slave.get(k)

    if ProCode is None:
        handler.up_result = 5003
        return handler.up_result

    body = {
        "LoginName": LoginName,
        "Password": Password,
        "SmsKind": 820,
        "ProCode": ProCode,
        "SendSim": SendSim,
        "OutTradeNo": OutTradeNo,
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
            root = ET.fromstring(response_body)
            respCode = root.find('Code').text

            result = RESULT_MAP.get(respCode, 9)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result