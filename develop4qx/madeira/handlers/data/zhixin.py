# 智信接口
import logging
import json
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '2': 0,  # 成功
    '602': 9,  # 服务器数据接收异常
    '603': 9,  # 请求数据参数格式错误
    '606': 9,  # 数据签名错误
    '621': 9,  # 商户余额不足
    '622': 9,  # 商户不存在
    '623': 9,  # 商品配置不正确
    '624': 9,  # 商品未配置
    '615': 9,  # 号码归属地信息未配置
    '625': 9,  # 重复订单号
    '751': 9,  # IP地址未绑定
    '626': 9,  # 订单号不存在
}


@tornado.gen.coroutine
def up_zhixin(handler, partner):
    handler.up_req_time = time.localtime()

    time_now = time.localtime()

    secret_key = partner["secret_key"]
    mrch_no = partner["mrch_no"]
    site_num = ""
    request_time = time.strftime("%Y%m%d%H%M%S", time_now)
    client_order_no = handler.order_id
    product_type = 4
    phone_no = handler.mobile
    cp = ""
    city_code = ""
    recharge_type = 0
    recharge_desc = ""
    notify_url = partner["notify_url"]

    recharge_amount = None
    k = 'private:zhixin:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    recharge_amount = handler.slave.get(k)

    if recharge_amount is None:
        handler.up_result = 5003
        return handler.up_result

    sign = to_md5(
        "city_code" + city_code + "client_order_no" + client_order_no + "cp" + cp + "mrch_no" + mrch_no + "notify_url" + notify_url + "phone_no" + phone_no + "product_type" + str(
            product_type) + "recharge_amount" + str(
            recharge_amount) + "recharge_desc" + recharge_desc + "recharge_type" + str(
            recharge_type) + "request_time" + request_time + "site_num" + site_num + secret_key)

    body = {
        "mrch_no": mrch_no,
        "site_num": site_num,
        "request_time": request_time,
        "client_order_no": client_order_no,
        "product_type": product_type,
        "phone_no": phone_no,
        "cp": cp,
        "city_code": city_code,
        "recharge_amount": recharge_amount,
        "recharge_type": recharge_type,
        "recharge_desc": recharge_desc,
        "notify_url": notify_url,
        "sign": sign,
    }

    body = json.dumps(body)

    url = partner["url_busi"]

    h = {'Content-Type': 'application/json; charset=utf-8'}

    result = 9999
    up_result = None
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', body=body, headers=h, request_timeout=120)

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