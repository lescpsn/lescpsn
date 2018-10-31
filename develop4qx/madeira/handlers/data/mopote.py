# encoding: utf8
import codecs
import json
import logging
import time
import hashlib
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError, HTTPClient

from Crypto.Cipher import AES

from handlers import signature
from utils import pad_bytes

request_log = logging.getLogger("madeira.request")

RESULT_MAPPING = {
    '0000': 0,
    '1000': 9,
    '1001': 9,
    '1002': 9,
    '1003': 9,
    '1004': 9,
    '1005': 9,
    '1006': 9,
    '1007': 9,
    '1008': 9,
    '1009': 9,
    '1010': 9,
    '1011': 9,
    '1012': 9,
    '1013': 9,
    '1014': 9,
    '1015': 9,
    '1016': 9,
    '1017': 9,
    '1018': 9,
    '1019': 9,
    '1020': 9,

    '2002': 9,
}


@tornado.gen.coroutine
def up_mopote(handler, partner):

    slave = handler.slave

    # private data
    k = 'private:mopote:{carrier}:{price}'.format(carrier=handler.carrier,
                                                  price=handler.price)

    amount, _range = slave.hmget(k, ['amount', 'range'])

    if amount is None:
        return 99999

    handler.up_req_time = time.localtime()
    str_time = time.strftime('%Y%m%d%H%M%S', handler.up_req_time)
    tsp = int(time.mktime(handler.up_req_time))

    code = json.dumps({
        'cpUser': partner.get('user'),
        'channelOrderId': handler.order_id,
        'content': '',
        'createTime': str_time,
        'type': 1,
        'amount': amount,
        'range': _range,
        'mobile': handler.mobile,
        'notifyUrl': partner.get('callback')
    })

    aes = AES.new(partner['aes_key'], AES.MODE_CBC, partner['aes_iv'])

    bytes = aes.encrypt(pad_bytes(code.encode('gbk')))
    encrypted = codecs.encode(bytes, 'hex').decode()

    digest = signature(encrypted).lower()

    # case-insensitive sort
    k = sorted([partner['user'], partner['sha_key'], digest, str(tsp)], key=lambda s: s.lower(), reverse=True)
    h = hashlib.sha1()
    h.update(''.join(k).encode())
    sign = h.hexdigest()

    url = partner['url.order']

    full_url = url + '?d={digest}&t={tsp}&s={sign}&a={user}'.format(
        digest=digest, tsp=str(tsp), sign=sign, user=partner['user'])

    request_log.info('CALL_REQ %s', code, extra={'orderid': handler.order_id})
    request_log.info('CALL_REQ %s', full_url, extra={'orderid': handler.order_id})
    request_log.info('CALL_REQ %s', encrypted, extra={'orderid': handler.order_id})

    response = None
    result = 99999
    up_result = None
    # call & wait
    http_client = AsyncHTTPClient()

    try:

        response = yield http_client.fetch(full_url, method='POST', body=encrypted,
                                           headers={'Content-Type': 'application/octet-stream; charset=UTF-8'},
                                           request_timeout=120)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    if response and response.code == 200:
        body = response.body.decode()
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            resp = json.loads(body)
            data = resp.get('data')
            if data:
                handler.up_order_id = data.get('orderId')
                up_result = data.get('status')

                if up_result:
                    result = RESULT_MAPPING.get(up_result,0)

        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    handler.up_result = up_result
    handler.up_resp_time = time.localtime()  # <--------------

    return result


def product_query():
    OP_MAP = {
        0: '移动',
        1: '联通',
        2: '电信'
    }

    http_client = HTTPClient()

    t = time.localtime()
    tsp = int(time.mktime(t))
    user = '205918'
    sign = signature(user, str(tsp), 'RtGpAPFoXiSY8BgDWz85V7GPPFJeWvoh')

    url = 'http://122.224.212.160:8980/common/quotation.action?cpUser={user}&time={tsp}&sign={sign}'.format(
        user=user, tsp=tsp, sign=sign)

    print(url)

    try:
        response = http_client.fetch(url, method='GET')
        if response.code == 200:
            body = response.body.decode()

            resp = json.loads(body)
            for obj in resp.get('data'):
                op_code = obj['opCode']
                size = obj['amount']
                price = obj['discountPrice']

                print('%s,%s,%s' % (OP_MAP.get(op_code), size, price))

    # except HTTPError as http_error:
    #     # request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
    # except Exception as e:
    #     # request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': order_id})
    finally:
        http_client.close()


def test_aes():
    code = '{"cpUser":"200266","channelOrderId":"201500000000001","content":"流量直充测试","createTime":"20150811154558","type":1,"amount":102400,"range":0,"mobile":"13333333333","notifyUrl":"http://www.xxx.com/"}'

    aes = AES.new('AYiZxwvT6IDeSffqWRaCyre9FDGQy5IT', AES.MODE_CBC, "176543218'653#23")

    s = pad_bytes(code.encode('gbk'))
    print(len(s) / 16)
    bytes = aes.encrypt(s)

    encrypted = codecs.encode(bytes, 'hex')
    print(encrypted)

    digest = signature(encrypted.decode()).lower()
    print(digest)

    k = sorted(['200266', 'aspRKtT074Bipl8E', digest, '1439279159'], reverse=True)

    h = hashlib.sha1()
    h.update(''.join(k).encode())
    print(h.hexdigest())


if __name__ == '__main__':
    product_query()
