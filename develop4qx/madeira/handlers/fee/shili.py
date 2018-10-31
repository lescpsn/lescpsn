import logging
import time
import xml.etree.ElementTree as et

import tornado.gen
from tornado.httpclient import AsyncHTTPClient

from handlers import signature


h = {'Content-Type': 'text/html'}

request_log = logging.getLogger("madeira.request")

REQUEST = r'''<?xml version="1.0" encoding="UTF-8"?><root>
<oid_biz>201001</oid_biz>
<jno_cli>{order_id}</jno_cli>
<oid_reguser>{user_id}</oid_reguser>
<uid_cli>{mobile}</uid_cli>
<price>{price}</price>
<sign>{sign}</sign>
<type></type>
<province></province>
<city></city>
</root>'''.replace('\n', '')

RESULT_MAPPING = {
    305: 5003,  # 商品不存在
    3051: 5003,  # 区域关闭
    3052: 5003,  # 完成方式关闭
    307: 5002,  # 账户余额不足
}


@tornado.gen.coroutine
def up_shili(handler, partner):
    handler.up_req_time = time.localtime()

    # sign
    t = '201001' + handler.order_id + partner['user'] + handler.mobile + handler.price + partner['key']
    sign = signature(t).lower()

    body = REQUEST.format(
        order_id=handler.order_id,
        user_id=partner['user'],
        mobile=handler.mobile,
        price=handler.price,
        sign=sign,
    )
    url = partner['url.order']
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    result = 9999
    if response and response.code == 200:
        body = response.body.decode()
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            root = et.fromstring(body)
            result = int(root.find('retcode').text)
            handler.up_order_id = root.find('oid_goodsorder').text
            # handler.up_cost = root.find('ordercash').text or 0
            handler.up_result = result
        except Exception as e:
            result = 9999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    # mapping
    result = RESULT_MAPPING.get(result, result)

    return result
