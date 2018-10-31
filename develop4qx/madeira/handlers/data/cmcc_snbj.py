# 卓望接口
import logging
import json
import tornado.gen
import hashlib
from tornado.httpclient import AsyncHTTPClient, HTTPError
from tornado.ioloop import IOLoop
import time
from utils.encryption_decryption import to_md5

CODE = 'serialNumber={serialNumber}&account={account}&bisCode={bisCode}&timeStamp={timeStamp}&sign={sign}&mobile={mobile}&serviceCode={serviceCode}&discntCode={discntCode}&month={month}&capFlow={capFlow}&effectiveWay={effectiveWay}'

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': 1,  # 成功
    '0102': 9,  # 参数错误
    '0103': 9,  # 校验失败
    '0104': 9,  # 账号不存在
    '0105': 9,  # Ip签权失败
    '0106': 9,  # 记录不存在
    '0108': 9,  # 含有无效同步手机号码
    '0109': 9,  # 手机号码同步超过限制
    '0110': 9,  # 时间戳过期
    '0098': 9,  # 处理方内部错误
    '0099': 9,  # 其他错误，由落地方自行解释
}


@tornado.gen.coroutine
def up_cmcc_snbj(handler, partner):
    handler.up_req_time = time.localtime()

    master = handler.master
    serialNumber = handler.order_id[:-4].replace("Q", "W")
    master.set('map:cmccbj:%s' % serialNumber, handler.order_id)

    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    account = partner['account']
    bisCode = partner['bisCode']
    serviceCode = partner['serviceCode']
    key = partner['key']

    sign = to_md5(serialNumber + account + bisCode + timestamp + key)

    k = 'private:cmcc_snbj:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    discntCode = handler.slave.get(k)

    if discntCode is None:
        handler.up_result = 5003
        return handler.up_result

    body = CODE.format(
        serialNumber=serialNumber,
        account=account,
        bisCode=bisCode,
        timeStamp=timestamp,
        sign=sign,
        mobile=handler.mobile,
        serviceCode=serviceCode,
        discntCode=discntCode,
        month='1',
        capFlow='',
        effectiveWay='',
    )

    url = partner["url_busi"]

    result = 9999
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            resp_code = response_body["resultCode"]
            result = RESULT_MAP.get(resp_code, 0)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if result == 1:
        yield handler.callback('1')

    return result
