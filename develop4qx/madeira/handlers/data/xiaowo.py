# 小沃接口
import logging
import json
import tornado.gen
import hashlib
from tornado.httpclient import AsyncHTTPClient, HTTPError
from tornado.ioloop import IOLoop
import time

CODE = 'serviceid={serviceid}&cpid={cpid}&usercode={usercode}&password={password}&pid={pid}&eftype={eftype}&reqordernum={reqordernum}&timeStamp={timeStamp}&gamecode={gamecode}'
request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0000': 0,  # 成功
    '0001': 9,  # 参数传输错误
    '0002': 9,  # Cp余额不足
    '0003': 9,  # 用户叠满
    '0004': 9,  # 活动结束
    '0005': 9,  # Cpid不存在
    '0006': 9,  # 活动id不存在
    '0007': 9,  # 产品id不存在
    '0008': 9,  # 用户未授权
    '0009': 9,  # 领取用户不正确
    '0010': 9,  # 其他错误
    '0011': 9,  # 验证码校验错误
    '0012': 9,  # 短信验证码校验错误
    '0013': 9,  # 手机号非联通号码
    '0014': 9,  # 当月已到达活动领取限额
    '0015': 9,  # 抢红包失败
    '0016': 9,  # 领取超时失效
    '1001': 9,  # 产品不可以叠加
    '1002': 9,  # 4G用户不能订购
    '1003': 9,  # 该用户无法再次叠加此档位流量包
    '1004': 9,  # 链接超时请稍后重试
    '1005': 9,  # 2G用户不能订购
    '1999': 9,  # 系统错误
}


def md5(str):
    m = hashlib.md5()
    m.update(str.encode())
    return m.hexdigest()


@tornado.gen.coroutine
def up_xiaowo(handler, partner):
    handler.up_req_time = time.localtime()

    timeStamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    cpid = partner["cpid"]
    usercode = handler.mobile
    secretkey = partner["secretkey"]
    data = cpid + '|' + usercode + '|' + timeStamp + '|' + secretkey
    password = md5(data)

    k = 'private:xiaowo:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    if handler.scope and handler.scope != '0':
        k = k + ':' + handler.scope

    pid = handler.slave.get(k)

    if pid is None:
        handler.up_result = 5003
        return handler.up_result

    body = CODE.format(
        serviceid='Asynorder',
        cpid=cpid,
        usercode=usercode,
        password=password,
        pid=pid,
        eftype='0',
        reqordernum=handler.order_id,
        timeStamp=timeStamp,
        gamecode=''
    )
    url = partner["url_busi"]
    url = url + '?' + body

    result = 9999
    http_client = AsyncHTTPClient()
    try:
        request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(url, method='GET', request_timeout=120)

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
            resp_code = response_body["returncode"]
            result = RESULT_MAP.get(resp_code, 0)
            handler.up_result = str(result)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result
