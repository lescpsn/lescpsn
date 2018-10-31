# encoding: utf-8

import json
import logging
import time
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError, HTTPClient

from handlers import signature

request_log = logging.getLogger("madeira.request")

PRICE_TO_PACKAGE = {
    3: '000010',  # 10M全国通用流量
    5: '000030',  # 30M全国通用流量
    10: '000070',  # 70M全国通用流量
    20: '000150',  # 150M全国通用流量
    30: '000500',  # 500M全国通用流量
    50: '001000',  # 1G全国通用流量
    70: '002000',  # 2G全国通用流量
    100: '003000',  # 3G全国通用流量
    130: '004000',  # 4G全国通用流量
    180: '006000',  # 6G全国通用流量
    280: '011000',  # 11G全国通用流量
}

RESULT_MAP = {
    '0000': 1,
    '0001': 0,
    '0102': 9,
    '0103': 9,
    '0104': 9,
    '0105': 9,
    '0106': 9,
    '0108': 9,
    '0109': 9,
    '0110': 9,
    '0098': 9,
    '0099': 9,
    '0201': 9,
    '0202': 9,
    '0203': 9,
    '0204': 9,
    '0205': 9,
    '0206': 9,
}

h = {'Content-Type': 'application/json; charset=utf-8'}


@tornado.gen.coroutine
def up_cmcc_sn(handler, partner):
    # product_id = partner['product_id']
    # package = handler.slave.get('private:cmcc-sn:%d' % handler.price, 'package')
    product_id = PRICE_TO_PACKAGE.get(handler.price)

    handler.up_req_time = time.localtime()
    t = time.time()

    tsp = time.strftime("%Y%m%d%H%M%S", time.localtime(t))
    channel_id = partner['channelId']
    # channelId+14位时间戳+6位序号
    seq_no = '%s%s%s' % (channel_id, tsp, handler.order_id[-6:])
    key = partner['key']

    sign = signature(channel_id, tsp, handler.mobile, seq_no, key)

    body = '&'.join([
        'channelId=' + channel_id,
        'timeStamp=' + tsp,
        'productId=' + product_id,
        'mobile=' + handler.mobile,
        'channelSeqNo=' + seq_no,
        'sign=' + sign.lower()
    ])

    url = partner['url.order']

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    result = 99999

    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)

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
        request_log.info('CALL_RESP %s', body.replace('\n', ''), extra={'orderid': handler.order_id})

        try:
            root = json.loads(body)
            handler.up_result = root.get('resultCode')
            handler.up_order_id = seq_no
            result = RESULT_MAP.get(handler.up_result, 0)

            if handler.up_result == '0001':
                handler.master.set('map:cmcc-sn:%s' % seq_no, handler.order_id)

        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    return result


def query_balance():
    http_client = HTTPClient()
    url = 'http://111.20.150.45:7001/FBSY/FBSYQueryBalance.do'

    t = time.time()
    tsp = time.strftime("%Y%m%d%H%M%S", time.localtime(t))

    sign = signature('100006', tsp, 'q59ka440')

    body = '&'.join([
        'channelId=' + '100006',
        'timeStamp=' + tsp,
        'sign=' + sign.lower()
    ])

    try:
        response = http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)

        resp = json.loads(response.body.decode())
        print(resp)

        b = int(resp.get('result').get('balance'))
        b = '%.02f' % (b / 100)

        print('BALANCE=%s' % b)
    finally:
        http_client.close()


if __name__ == '__main__':
    query_balance()
