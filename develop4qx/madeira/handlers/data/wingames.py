# 冠游接口
import logging
import json
import datetime
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '00': 0,  # 成功
    '01': 9,  # 鉴权参数确实
    '02': 9,  # 流量包ID为空
    '03': 9,  # 分发用户为空
    '04': 9,  # 流量包ID错误
    '05': 9,  # 手机号码格式错误
    '06': 9,  # 订单号为空
    '07': 9,  # 健全信息错误
    '08': 9,  # 签名验证失败
    '09': 9,  # APPID已经失效
    '10': 9,  # 订单号错误
    '11': 9,  # 日期参数错误
    '12': 9,  # 超出运营商风险控制要求
    '99': 9,  # 其他错误
    '30': 9,  # 区域省份业务系统维护
}


@tornado.gen.coroutine
def up_wingames(handler, partner):
    handler.up_req_time = time.localtime()

    t = str(datetime.datetime.now().microsecond)
    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime()) + t

    appid = partner["appid"]
    appsecert = partner["appsecert"]
    user = handler.mobile
    extorder = handler.order_id
    seqno = handler.order_id
    ordertype = "1" #固定

    packageid = None
    k = 'private:wingames:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    packageid = handler.slave.get(k)

    if packageid is None:
        handler.up_result = 5003
        return handler.up_result

    secertkey = to_md5(timestamp + str(seqno) + appid + appsecert)
    sign = to_md5(appsecert + user + packageid + ordertype + extorder)

    body = {
        "HEADER": {
            "VERSION": "V1.1",
            "TIMESTAMP": timestamp,
            "SEQNO": seqno,
            "APPID": appid,
            "SECERTKEY": secertkey
        },
        "MSGBODY": {
            "CONTENT": {
                "SIGN": sign,
                "ORDERTYPE": ordertype,
                "USER": user,
                "PACKAGEID": packageid,
                "EXTORDER": extorder,
                "NOTE": '',
            }
        }
    }

    body = json.dumps(body)

    url = partner["url_busi"]

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

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            resp_code = response_body["MSGBODY"]["RESP"]["RCODE"]
            result = RESULT_MAP.get(resp_code, 9)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result