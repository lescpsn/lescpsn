import logging
import time
import xml.etree.ElementTree as ET

import tornado
from tornado.httpclient import AsyncHTTPClient, HTTPError
from handlers import signature, gen_key, signature64

RESULT_MAP = {
    '0000': 0,  # 成功
    '0017': 9,  # 移动通道未开通或维护中
    '0019': 9,  # 未开通手机号[13488351206]所在区域充值！
    '0022': 9,  # 余额不足！
    '0027': 9,  # 未开通移动通道
    '0035': 9,  # 可切换的网关通道无相同的流量包
    '0090': 9,  # 电信通道故障！
    '0091': 9,  # 移动号码(15034557033)所在区域(山西运城)处于维护状态
    '0099': 9,  # 用户取消
}

request_log = logging.getLogger("madeira.request")

REQUEST = r'''
<request>
  <head>
    <custInteId>{cust_id}</custInteId>
    <orderId>{up_order_id}</orderId>
    <orderType>1</orderType>
    <echo>{echo}</echo>
    <timestamp>{tsp}</timestamp>
    <version>1</version>
    <chargeSign>{sign}</chargeSign>
  </head>
  <body>
    <item>
      <packCode>{pack_code}</packCode>
      <mobile>{mobile}</mobile>
      <effectType>1</effectType>
    </item>
  </body>
</request>
'''.replace('\n', '')


@tornado.gen.coroutine
def up_xicheng(handler, partner):
    """
    """
    pack_code = handler.slave.hget('private:xicheng:%s:%s' % (handler.carrier, handler.price), 'prd_code')
    request_log.info('PACK_CODE %s', pack_code, extra={'orderid': handler.order_id})

    echo = gen_key(8)

    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)
    up_order_id = handler.order_id[3:]

    sign = signature64(partner['cust_id'] + up_order_id + partner['secret'] + echo + tsp)

    body = REQUEST.format(
        cust_id=partner['cust_id'],
        up_order_id=up_order_id,
        mobile=handler.mobile,
        pack_code=pack_code,
        tsp=tsp,
        echo=echo,
        sign=sign,
    )

    url = partner['url.order']

    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    up_result = None
    result = 99999

    try:
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code

    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode()
        request_log.info('CALL_RESP %s', body.replace('\r\n', ''), extra={'orderid': handler.order_id})

        try:
            root = ET.fromstring(body)
            up_result = root.find('result').text

            if up_result != '1003':
                result = RESULT_MAP.get(up_result, 9)
            elif up_result == '1003':
                desc = root.find('desc')
                if desc is None or desc.text is None:
                    result = 9
                else:
                    desc = desc.text

                    if '欠费' in desc:
                        result = 10020
                    elif '停机' in desc:
                        result = 10020
                    elif '状态' in desc and '用户' in desc:
                        result = 10111
                    elif '互斥' in desc:
                        result = 10019
                    else:
                        result = 9

            handler.up_order_id = up_order_id
            handler.up_cost = handler.cost
            handler.up_result = up_result

        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    return result
