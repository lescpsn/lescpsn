import logging
import time
from urllib.parse import quote
import xml.etree.ElementTree as et

import tornado.gen
from tornado.httpclient import AsyncHTTPClient

from handlers import signature

h = {'Content-Type': 'application/x-www-form-urlencoded'}

request_log = logging.getLogger("madeira.request")


@tornado.gen.coroutine
def up_esai(handler, partner):
    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y-%m-%d %H:%M:%S", handler.up_req_time)
    # t2 = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)
    price = handler.price

    in_order = 'IP%s%s%s' % (partner['user_number'], handler.order_id[1:15], handler.order_id[-4:])

    # sign UserNumber + PhoneNumber+ Province + City + PhoneClass + PhoneMoney(正整数) +Time + Sign
    sign = signature(partner['user_number'], in_order, handler.order_id, handler.mobile, 'Auto', 'Auto', 'Auto', price,
                     'None', tsp, '600', partner['key'])

    body = '&'.join(['UserNumber=%s' % partner['user_number'],
                     'InOrderNumber=%s' % in_order,
                     'OutOrderNumber=%s' % handler.order_id,
                     'PhoneNumber=%s' % handler.mobile,
                     'Province=Auto',
                     'City=Auto',
                     'PhoneClass=Auto',
                     'PhoneMoney=%s' % price,
                     'SellPrice=None',
                     'StartTime=%s' % quote(tsp),
                     'TimeOut=600',
                     'RecordKey=%s' % sign[0:16],
                     'Remark=--'])

    url = partner['url.order']

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', body=body,
                                           connect_timeout=60, request_timeout=60)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    result = 9999
    if response and response.code == 200:
        body = response.body.decode('gbk')
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            root = et.fromstring(body)
            r = root.find('result').text

            if r == 'success':
                handler.up_order_id = root.find('inOrderNumber').text
                result = 0
            elif r in ['sameorder', 'ordererr', 'attrerr', 'phoneerr', 'moneyerr', 'sellpriceerr', 'dberr']:
                result = 5003

            handler.up_result = result
        except Exception as e:
            result = 9999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
