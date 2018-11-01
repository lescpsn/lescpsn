import base64
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


@tornado.gen.coroutine
def up_quxun(handler, partner):
    key1 = 'private:quxun:{carrier}:{area}:{price}'.format(
        carrier=handler.carrier,
        area=handler.area,
        price=handler.price)

    key2 = 'private:quxun:{carrier}:{price}'.format(
        carrier=handler.carrier,
        price=handler.price)

    if handler.scope:
        key1 = '%s:%s' % (key1, handler.scope)
        key2 = '%s:%s' % (key2, handler.scope)

    p1, p2 = handler.slave.mget(key1, key2)
    plat_offer_id = p1 or p2
    if plat_offer_id is None:
        return 9999

    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)

    code = json.dumps({
        'request_no': handler.order_id,
        'contract_id': '100001',
        'order_id': handler.order_id,
        'plat_offer_id': plat_offer_id,
        'phone_id': handler.mobile,
        'facevalue': handler.price,
    })

    request_log.info('CALL_CODE %s', code, extra={'orderid': handler.order_id})

    # aes
    passphrase = partner['pass']
    iv = partner['iv']

    aes = AES.new(passphrase, AES.MODE_CBC, iv)
    b = aes.encrypt(pad(code))
    encrypted = base64.b64encode(b).decode('utf8')

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
