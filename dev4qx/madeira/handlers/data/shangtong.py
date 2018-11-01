# 尚通接口
import logging
import json
import time
import tornado.gen
from urllib.parse import urlencode
from tornado.httpclient import AsyncHTTPClient, HTTPError
from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': 0,  # 下单成功
    '1000': 9,  # 用户不存在
    '1001': 9,  # IP 鉴权失败
    '1002': 9,  # 签名校验失败
    '3002': 90005,  # 无效手机号
    '3003': 9,  # 无效区域代号
    '3004': 9,  # 无效流量包大小
    '3005': 9,  # 无法找到相应的产品
    '3006': 9,  # 无法找到相应的库存
    '4000': 9,  # 余额不足
    '4001': 9,  # 余额不足（上级）
    '8000': 9,  # 其他错误。请联系工程师跟进。
}


@tornado.gen.coroutine
def up_shangtong(handler, partner):
    handler.up_req_time = time.localtime()
    account = partner["account"]
    action = 'Charge'
    apikey = partner["apikey"]
    phone = handler.mobile
    range = 0
    timeStamp = str(int(time.time()))

    size = None
    k = 'private:shangtong:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    size = handler.slave.get(k)

    if size is None:
        handler.up_result = 5003
        return handler.up_result

    data = '{apikey}account={account}&action={action}&phone={phone}&range={range}&size={size}&timeStamp={timeStamp}{apikey}'.format(
        apikey=apikey,
        account=account,
        action=action,
        phone=phone,
        size=int(size),
        range=range,
        timeStamp=timeStamp)

    sign = to_md5(data)

    body = {
        "account": account,
        "action": action,
        "phone": phone,
        "size": size,
        "range": range,
        "timeStamp": timeStamp,
        'sign': sign,
    }

    body = urlencode(body)
    url = partner['url.order']

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
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            up_result = response_body["respCode"]
            sp_order_id = response_body.get("orderID")
            handler.up_order_id = sp_order_id

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

            if handler.up_result == '0000':
                handler.master.set("map:shangtong:{sp_order_id}".format(sp_order_id=sp_order_id), handler.order_id)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
