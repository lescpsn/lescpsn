import logging
import time
import datetime
import json
import tornado.gen
import hashlib
from tornado.httpclient import AsyncHTTPClient, HTTPError

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '00': 0,  # 成功
    '01': 9,  # 鉴权参数缺失
    '02': 9,  # 流量包 ID 为空
    '03': 9,  # 分发用户为空
    '04': 9,  # 流量包 ID 错误
    '05': 9,  # 手机号码格式错误
    '06': 9,  # 订单号为空／或 CP 订单号重复
    '07': 9,  # 鉴权信息错误
    '08': 9,  # 签名验证失败
    '09': 9,  # APPID 已经失效
    '10': 9,  # 订单号错误
    '11': 9,  # 日期参数错误
    '12': 9,  # 超出运营商风险控制要求
    '99': 9,  # 其他错误
}


def md5(str):
    m = hashlib.md5()
    m.update(str.encode("gb2312"))
    return m.hexdigest().upper()


@tornado.gen.coroutine
def up_niukou(handler, partner):
    handler.up_req_time = time.localtime()

    t = datetime.datetime.now()
    timestamp = t.strftime("%Y%m%d%H%M%S")
    hm = str(t.microsecond)[0:3]
    TIMESTAMP = timestamp + hm

    APPSecret = partner["APPSecret"]
    APPID = partner["APPID"]
    SEQNO = handler.order_id
    USER = handler.mobile
    ORDERTYPE = "1"
    EXTORDER = handler.order_id

    k = 'private:niukou:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    PACKAGEID = handler.slave.get(k)

    if PACKAGEID is None:
        handler.up_result = 5003
        return handler.up_result

    secertkey = TIMESTAMP + SEQNO + APPID + APPSecret
    sign = APPSecret + USER + PACKAGEID + ORDERTYPE + EXTORDER
    SECERTKEY = md5(secertkey)
    SIGN = md5(sign)

    # 订单生成
    url_send = partner["url_send"]

    code = {
        "HEADER": {
            "VERSION": "V1.0",
            "TIMESTAMP": TIMESTAMP,
            "SEQNO": SEQNO,
            "APPID": APPID,
            "SECERTKEY": SECERTKEY
        },
        "MSGBODY": {
            "CONTENT": {
                "SIGN": SIGN,
                "USER": USER,
                "PACKAGEID": PACKAGEID,
                "ORDERTYPE": ORDERTYPE,
                "EXTORDER": EXTORDER,
                "Note": ""
            }
        }
    }
    url = url_send
    body = json.dumps(code)

    result = 9999
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

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            resp_code = response_body["MSGBODY"]["RESP"]["RCODE"]
            up_order_id = response_body["MSGBODY"]["CONTENT"]["ORDERID"]

            handler.up_result = resp_code
            handler.up_order_id = up_order_id

            result = RESULT_MAP.get(resp_code, 9)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    handler.up_resp_time = time.localtime()

    return result
