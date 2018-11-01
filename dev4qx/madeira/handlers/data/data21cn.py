import json
import logging
import time

from Crypto.Cipher import AES
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError


h = {'Content-Type': 'application/json'}

request_log = logging.getLogger("madeira.request")

BLOCK_SIZE = 16


def pad(s):
    return s + (BLOCK_SIZE - len(s) % BLOCK_SIZE) * chr(BLOCK_SIZE - len(s) % BLOCK_SIZE)


def hexlify(s):
    """
    ord('a')=>97
    """
    str = ''
    for byte in s:
        str += chr(97 + ((byte >> 4) & 0xF))
        str += chr(97 + (byte & 0xF))

    return str


@tornado.gen.coroutine
def up_21cn(handler, partner):
    """
    telecom -> up_order
    """
    key = '21cn:%d' % handler.price

    if 'prefix' in partner:
        key = 'private:%s:%s' % (partner['prefix'], key)

    if handler.scope:
        key = '%s:%s' % (key, handler.scope)

    prod = handler.slave.hmget(key, ['plat_offer_id', 'activity_id'])

    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)

    passphrase = partner['pass']
    iv = partner['iv']

    # {"request_no":"201410211021070000000113",
    # "service_code":"FS0001",
    # "contract_id":"100052",
    # "order_id":"0",
    # "plat_offer_id":"100151", 100151:100033
    # "phone_id":"18905172668",
    # "channel_id":"1",
    # "activity_id":"100033"}
    code = json.dumps({
        'request_no': handler.order_id,
        'service_code': 'FS0001',
        'contract_id': partner['contract_id'],
        'order_id': '0',
        'plat_offer_id': prod[0],
        'phone_id': handler.mobile,
        'channel_id': '1',
        'activity_id': prod[1],
    })

    request_log.info('CALL_CODE %s', code, extra={'orderid': handler.order_id})

    # aes
    aes = AES.new(passphrase, AES.MODE_CBC, iv)
    bytes = aes.encrypt(pad(code))
    encrypted = hexlify(bytes)

    body = json.dumps({'partner_no': partner['partner_no'], 'code': encrypted})

    url = partner['url.order']

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    response = None
    result = 99999
    # call & wait
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body)
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode('utf8')
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            # {"request_no":"201410211021070000000113","result_code":"00000"}
            resp = json.loads(body)
            result = int(resp['result_code'])
            handler.up_order_id = resp['request_no']
            handler.up_cost = handler.cost
            handler.up_result = result
        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    return result
