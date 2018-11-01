import logging
import time
from tornado.ioloop import IOLoop
from urllib.parse import quote
import xml.etree.ElementTree as et

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from handlers import signature

h = {'Content-Type': 'application/x-www-form-urlencoded'}

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': 0,
    '0001': 5012,
    '0002': 5003,
    '0003': 5003,
    '0004': 5003,
    '0007': 9999,
    '0009': 9999,
    '0010': 9999,
    '0011': 9999,
    '9999': 9999
}

QUERY_MAP = {
    '0': 0,  # 等待处理
    '1': 0,  # 暂停处理
    '2': 0,  # 正在处理
    '6': 0,  # 正在缴费
    '11': 1,  # 处理成功
    '16': 1,  # 缴费成功
    '20': 9,  # 取消处理
    '21': 9,  # 处理失败
    '26': 9,  # 缴费失败
    '99': 9,  # 冻结
}


@tornado.gen.coroutine
def up_fengyun(handler, partner):
    handler.up_req_time = time.localtime()

    body = '&'.join([
        'ShtVer=02',
        'Action=CZ',
        'AgentAccount=%s' % partner['account'],
        'Phone=%s' % handler.mobile,
        'Payment=%s' % handler.price,
        'Orderid=%s' % handler.order_id[4:],
        # '&RetUrl=' + quote(partner['callback'])
    ])

    sign = signature(body + '&Password=%s' % partner['key'])

    url = partner['url.order'] + '?' + body + '&Sign=' + sign.lower()

    request_log.info('CALL_REQ %s', url, extra={'orderid': handler.order_id})

    # call & wait
    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='GET', connect_timeout=60, request_timeout=60)
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
            for args in body.split('&'):
                k, v = args.split('=')

                if k == 'Errorcode':
                    result = RESULT_MAP.get(v, 0)
                elif k == 'Chargeid':
                    handler.up_order_id = v

        except Exception as e:
            result = 9999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if result in [0]:
        for i in range(5):
            # wait
            yield tornado.gen.Task(IOLoop.instance().add_timeout, time.time() + 60 * i)
            # query
            result = yield query_fengyun_order(handler, partner)
            if result in [1, 9]:
                break

    handler.up_result = result

    if result == 1:
        yield handler.callback('1')

    elif result == 9:
        yield handler.callback('9')

    elif result == 0:
        handler.master.sadd('set:pending:fengyun', handler.order_id)
        request_log.info('FENGYUN NOT_FINISHED', extra={'orderid': handler.order_id})

    return result


@tornado.gen.coroutine
def query_fengyun_order(handler, partner):
    result = 0

    query = '&'.join([
        'ShtVer=02',
        'Action=CX',
        'AgentAccount=%s' % partner['account'],
        'Orderid=%s' % handler.order_id[4:]
    ])

    sign = signature(query, '&Password=%s' % partner['key'])

    url = partner['url.query'] + '?' + query + '&Sign=' + sign.lower()

    request_log.info('QUERY_REQ %s', url, extra={'orderid': handler.order_id})

    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, method='GET')

        if response and response.code == 200:
            body = response.body.decode('gbk')
            request_log.info('QUERY_RESP %s', body, extra={'orderid': handler.order_id})

            for args in body.split('&'):
                k, v = args.split('=')

                if k == 'Orderstatu_int':
                    result = QUERY_MAP.get(v, 0)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})

    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})

    finally:
        http_client.close()

    return result
