# 比特峰接口
import hashlib
import json
import logging
import time
from urllib.parse import urlencode

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    "E00000": 1,
    "E10000": 0,  #订单提交成功
    "E10001": 9,  # 时间戳超时
    "E10002": 9,  #企业账号不存在
    "E10003": 9,  #ip非法
    "E10004": 9,  #签名错误
    "E10005": 10074,  #手机号不正确
    "E10006": 9,  #流量产品不存在
    "E10007": 9,  #余额不足
    "E10008": 9,  #余额变更失败
    "E10009": 9,  #订单提交失败
    "E10010": 9,  #超速，同一手机号过于频繁进行充值(10分钟内超过5次)
    "E10011": 9,  #超限，同一手机号每日充值次数超过限制（24小时内超过20次）
    "E10012": 9,  #月末48小时（移动）、24小时（电信）无法充值
    "E20001": 9,  #订单不存在
    "E20002": 9,  #订单已退款
    "E20004": 9,  #平台系统升级，请稍候订购
    "E31001": 9,  #运营商维护
    "E31002": 9,  #运营商侧错误
    "E31003": 10033,  #有在途工单
    "E31004": 9,  #此用户不可订购此产品
    "E31005": 10058,  #客户业务受限
    "E31006": 9,  #运营商判断此号码非法
    "E31007": 10058,  #2G/3G 融合用户不允许订购
    "E31100": 9,  #其他错误
    "E31101": 10111,  #用户状态异常（？）
    "E31102": 10111,  #用户状态异常（不在有效期）
    "E31103": 10111,  #用户状态异常（用户套餐不能订购该业务）
    "E31104": 10111,  #用户状态异常（叠加次数超限）
    "E31105": 10111,  #用户状态异常（欠费停机）
    "E31106": 10111,  #用户状态异常（服务密码为初始密码）
    "E31107": 10111,  #用户状态异常（用户不存在）
    "E31108": 10111,  #用户状态异常（资料不全）
    "E40001": 10111,  #用户状态异常（黑名单用户）
    "E40002": 10111,  #用户状态异常（身份证需要升位）
}


def to_sha1(part):
    sha1 = hashlib.sha1()
    sha1.update(part.encode())
    return sha1.hexdigest()


@tornado.gen.coroutine
def up_bitfeng(handler, partner):
    handler.up_req_time = time.localtime()

    corpid = partner["corpid"]
    token = partner["token"]
    client_order_id = handler.order_id
    mobile = handler.mobile
    timestamp = str(int(time.time()))
    nonce = "bitfeng"

    amount = None
    k = 'private:bitfeng:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    amount = handler.slave.get(k)

    if amount is None:
        handler.up_result = 5003
        return handler.up_result

    data = {
        "token": token,
        "timestamp": timestamp,
        "nonce": "bitfeng",
        "amount": amount,
        "mobile": mobile,
        "client_order_id": client_order_id
    }

    signature = to_sha1(json.dumps(data, sort_keys=True).replace(' ', ''))

    body = {
        "corpid": corpid,
        "timestamp": timestamp,
        "nonce": nonce,
        "mobile": mobile,
        "amount": amount,
        "signature": signature,
        "client_order_id": client_order_id
    }

    body = urlencode(body)

    url = partner["url_busi"]

    url = url + "?" + body
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
            up_result = response_body["status"]

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result