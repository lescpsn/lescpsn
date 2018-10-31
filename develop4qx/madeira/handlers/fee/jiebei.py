import logging
import time
import xml.etree.ElementTree as ET
from urllib.parse import urlencode

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': 0,  # 请求成功
    '501': 9,  # 必要参数为空
    '502': 9,  # 参数取值不正确或不符合要求
    '503': 9,  # 下单时间与服务器时间相差10分钟以上
    '504': 9,  # 无此订单
    '505': 9,  # 提交IP不在白名单中
    '84': 9,  # 余额不足,请先储值!
    '201': 9,  # 找不到这个用户ID
    '203': 9,  # 帐号状态为禁止登录
    '226': 9,  # 找不到归属地
    '227': 9,  # 找不到该商品
    '228': 9,  # 订单信息校验错误
    '229': 9,  # 生成订单失败
    '230': 9,  # 充值订单号重复
    '231': 9,  # 不支持该面值
    '245': 9,  # 该商品维护关闭或该商品维护中
    '247': 9,  # 帐号状态为禁止充值或该帐号不是商户账户
    '999': 9,  # 其他错误,请与平台对接技术联系
    '444': 9,  # 系统维护
}


@tornado.gen.coroutine
def up_jiebei(handler, partner):
    handler.up_req_time = time.localtime()

    userid = partner["userid"]
    orderid = handler.order_id
    account = handler.mobile
    amount = handler.price
    shoptype = partner["shoptype"]
    shopid = partner["shopid"]
    area = partner["area"]
    ordertime = time.strftime("%Y-%m-%d %H:%M:%S", handler.up_req_time)
    backurl = partner["backurl"]
    key = partner["key"]

    data = 'userid=' + str(userid) + '&orderid=' + orderid + '&account=' + account + '&amount=' + str(
        amount) + '&shoptype=' + str(
        shoptype) + '&shopid=' + shopid + '&area=' + area + '&ordertime=' + ordertime + '&backurl=' + backurl + '&key=' + key
    vstr = to_md5(data)

    # package

    body = {
        'userid': userid,
        'orderid': orderid,
        'account': account,
        'amount': amount,
        'shoptype': shoptype,
        'shopid': shopid,
        'area': area,
        'ordertime': ordertime,
        'backurl': backurl,
        'vstr': vstr
    }

    body = urlencode(body)
    url = partner["url.order"]
    request_log.info('JIEBEI CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    result = 9999
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', body=body, connect_timeout=30, request_timeout=60)

    except HTTPError as http_error:
        request_log.error('JIEBEI CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('JIEBEI CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None

    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode('gb2312')

        request_log.info('JIEBEI CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            root = ET.fromstring(body)
            handler.up_result = root.find("status").text
            result = RESULT_MAP.get(handler.up_result, 0)

        except Exception as e:
            result = 9999
            request_log.error('JIEBEI PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
