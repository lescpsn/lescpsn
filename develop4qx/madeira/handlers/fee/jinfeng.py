import hashlib
import logging
import time
import xml.etree.ElementTree as et
from urllib import request
from urllib.parse import urlencode, quote

import binascii
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from handlers import signature

h = {'Content-Type': 'application/x-www-form-urlencoded'}

request_log = logging.getLogger("madeira.request")


def to_hmac(value, key):
    kb = bytearray(key.encode())

    kin = bytearray(b'\x36' * 64)
    kout = bytearray(b'\x5c' * 64)

    for i in range(len(kb)):
        kin[i] = kb[i] ^ kin[i]
        kout[i] = kb[i] ^ kout[i]

    m = hashlib.md5()
    m.update(kin)
    m.update(value.encode())
    mid = m.digest()

    m = hashlib.md5()
    m.update(kout)
    m.update(mid)

    return m.hexdigest()


PRODUCT_MAP = {
    1: 'SHKC',
    2: 'SHKC_CU',
    3: 'SHKC_CT'
}

RESULT_MAP = {
    '100000': 9,  # 无参数
    '100001': 9,  # P0_biztype值为空
    '100002': 9,  # P0_biztype超长 11位
    '100003': 9,  # P0_biztype错误 不等于mobiletopup
    '100004': 9,  # P1_agentcode为空 代理商编号为空
    '100005': 9,  # P1_agentcode 只能是 16个字符
    '100006': 9,  # P1_agentcode代理商不存在
    '100007': 9,  # P2_mobile为空
    '100008': 9,  # P2_mobile不是11位
    '100009': 9,  # P2_mobile不支持该号段
    '100010': 9,  # P3_parvalue为空
    '100011': 9,  # P3_parvalue充值面额过大（最大长度为7）
    '100012': 9,  # P3_parvalue充值面额为负数
    '100013': 9,  # P4_productcode为空
    '100014': 9,  # P4_productcode 代理商编号位数不对
    '100015': 9,  # P5_requestid为空
    '100016': 9,  # P5_requestid超长（最大长度为30）
    '100017': 9,  # P6_callbackurl超长
    '100018': 9,  # P7_extendinfo扩展信息超长（最大长度为100）
    '100019': 9,  # hmac为空
    '100020': 9,  # hmac超长
    '100021': 9,  # P2_mobile手机号码包含非数字字符
    '100022': 9,  # P3_parvalue面额包含非数字字符
    '100023': 5003,  # 产品没开通
    '100024': 5003,  # 产品状态没开通
    '100025': 5003,  # 面额没有开通
    '100026': 5003,  # 区域没有开通
    '100027': 5002,  # 判断代理商金额是否小于当前充值的面额
    '100028': 9,  # hmac签名错误 (在request里面进行判断)
    '100029': 9,  # P5_requestid不能重复
    '100030': 9,  # 提交产品类别不合法（SHKC，SHKC_CU，SHKC_CT）
    '100031': 9,  # ip不正确
    '100032': 9,  # 扣款失败（可能是重复冲的订单编号，请知晓，通过查询或者客服去处理）
    '000000': 0,  # 成功

}


@tornado.gen.coroutine
def up_jinfeng(handler, partner):
    handler.up_req_time = time.localtime()
    # tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)

    product_code = PRODUCT_MAP.get(handler.carrier)
    if product_code is None:
        return 9

    hmac = to_hmac('mobiletopup' + partner['agent_code'] + handler.mobile + handler.price + product_code +
                   handler.order_id + partner['back_url'],
                   partner['key'])

    # package
    body = urlencode({
        'P0_biztype': 'mobiletopup',
        'P1_agentcode': partner['agent_code'],
        'P2_mobile': handler.mobile,
        'P3_parvalue': handler.price,
        'P4_productcode': product_code,
        'P5_requestid': handler.order_id,
        'P6_callbackurl': partner['back_url'],
        'P7_extendinfo': '',
        'hmac': hmac,
    })

    url = partner['url.order']

    request_log.info('JINFENG CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    result = 9999
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body,
                                           connect_timeout=30, request_timeout=60)

    except HTTPError as http_error:
        request_log.error('JINFENG CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('JINFENG CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None

    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode()
        request_log.info('JINFENG CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            handler.up_result = body
            result = RESULT_MAP.get(handler.up_result, 9)

        except Exception as e:
            result = 9999
            request_log.error('JINFENG PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result


if __name__ == '__main__':
    p = to_hmac('mobiletopup', 'FC096367A92740622726F0FD225DC7DF')
    print(p)
    print('4d08db5e9d4ff0894ee2c4944af3df84')
