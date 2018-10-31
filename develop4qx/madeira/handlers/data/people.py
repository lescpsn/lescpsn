# 智信接口
import binascii
import hashlib
import json
import logging
import time
from urllib.parse import urlencode

import tornado.gen
from Crypto.Cipher import AES
from tornado.httpclient import AsyncHTTPClient, HTTPError

request_log = logging.getLogger("madeira.request")

BS = 16


def peoples_padding(s):
    return s + (BS - len(s) % BS) * chr(BS - len(s) % BS)


def peoples_aes(code, secret_key, iv):
    aes = AES.new(secret_key, AES.MODE_CBC, iv)
    b = aes.encrypt(peoples_padding(code))
    return binascii.hexlify(b).decode()


def peoples_sha1(s):
    m = hashlib.sha1()
    m.update(s.encode())
    return m.hexdigest()


@tornado.gen.coroutine
def up_people(handler, partner):
    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)

    k = 'private:people:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    p_code = handler.slave.get(k)

    if p_code is None:
        handler.up_result = 5003
        return handler.up_result

    # times
    k = 'map:people:%s' % handler.mobile
    t = handler.master.hincrby(k, 't')

    if t > 2:
        request_log.error('PEOPLE >2', extra={'orderid': handler.order_id})
        handler.up_result = 5003
        return handler.up_result

    if t == 2:
        t2 = handler.master.hget(k, 'tsp')
        if t2 and t2.isdigit():
            t2 = int(t2)
            t1 = int(time.mktime(handler.up_req_time))

            if t1 - t2 < 180:
                request_log.info('PEOPLE SLEEP %d', 180 - (t1 - t2), extra={'orderid': handler.order_id})
                yield tornado.gen.sleep(180 - (t1 - t2))
                request_log.info('PEOPLE SLEEP OUT', extra={'orderid': handler.order_id})

    if t == 1:
        t1 = int(time.mktime(handler.up_req_time))
        handler.master.hset(k, 'tsp', t1)
        handler.master.expire(k, 30 * 24 * 3600)

    sign_key = partner["sign_key"]
    secret_key = partner["secret_key"]
    iv = partner["iv"]

    user_id = partner["user_id"]

    body = json.dumps({
        "user_id": user_id,
        "user_order_id": handler.order_id,
        "pcode": p_code,
        "mobile": handler.mobile,
    })

    aes_body = peoples_aes(body, secret_key, iv)

    dsign = peoples_sha1(aes_body)
    sign = peoples_sha1(str(user_id) + dsign + tsp + sign_key)

    query = urlencode({
        "user_id": user_id,
        "time": tsp,
        "sign": sign,
        "dsign": dsign,
    })

    url = partner['url.order']
    url = url + '?' + query

    h = {'Content-Type': 'multipart/form-data'}

    result = 9999

    http_client = AsyncHTTPClient()

    try:
        request_log.info("PEOPLE REQ %s - %s", query, body, extra={'orderid': handler.order_id})

        response = yield http_client.fetch(url, method='POST', body=aes_body, headers=h, request_timeout=120)

    except HTTPError as http_error:
        request_log.error('PEOPLE CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('PEOPLE CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            up_result = response_body.get('status')
            up_order_id = response_body.get("order_id")
            handler.up_order_id = up_order_id
            handler.up_result = up_result

            if up_result == 0:
                result = 0
            else:
                result = 9

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
