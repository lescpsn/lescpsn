# 未来无限接口
import base64
import logging
import json
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import md5_signature


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': 0,  # 成功
    '1': 9,  # 参数xxx 不能为空/类型不对/长度不对 等
    '200': 9,  # 产品不存在
    '201': 9,  # 产品已下架
    '220': 9,  # 无法识别手机号所属的运营商
    '221': 9,  # 不支持所在省份
    '222': 9,  # 不支持运营商
    '240': 9,  # 余额不足
    '241': 9,  # 余额达到了最大限制
    '300': 9,  # 渠道不存在
    '301': 9,  # 渠道无效
    '302': 9,  # 渠道类型不对
    '320': 9,  # 签名错误
    '321': 9,  # ip鉴权错误
    '9001': 9,  # 系统错误
    '9999': 9,  # 系统故障
}

CODE = "appkey={appkey}&productid={productid}&phoneno={phoneno}&backurl={backurl}&timestamp={timestamp}&transno={transno}&subtransno={subtransno}&sign={sign}"


@tornado.gen.coroutine
def up_ruanyunbi(handler, partner):
    handler.up_req_time = time.localtime()

    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    appkey = partner["appkey"]
    appsecret = partner["appsecret"]
    backurl = partner["backurl"]

    phoneno = handler.mobile
    subtransno = handler.order_id
    transno = handler.order_id

    base_backurl = str(base64.b64encode(backurl.encode()), encoding='utf-8')

    productid = None
    k = 'private:ruanyunbi:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    productid = handler.slave.get(k)

    if productid is None:
        handler.up_result = 5003
        return handler.up_result

    data = appsecret + 'appkey' + appkey + 'backurl' + base_backurl + 'phoneno' + phoneno + 'productid' + productid + 'subtransno' + subtransno + 'timestamp' + timestamp + 'transno' + transno + appsecret
    sign = md5_signature(data)

    body = CODE.format(
        transno=transno,
        subtransno=subtransno,
        appkey=appkey,
        productid=productid,
        phoneno=phoneno,
        backurl=base_backurl,
        timestamp=timestamp,
        sign=sign,
    )
    url = partner["url_busi"]
    url = url + '?' + body

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
            if "orderid" in response_body:
                handler.up_order_id = response_body["orderid"]

            resp_code = response_body["code"]
            result = RESULT_MAP.get(resp_code, 9)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.exception('PARSE UPSTREAM', extra={'orderid': handler.order_id})
    return result