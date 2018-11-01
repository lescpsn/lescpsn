#乐免订单接口
import time
import json
import logging
import tornado.gen
from urllib.parse import quote

from tornado.httpclient import AsyncHTTPClient
from utils.encryption_decryption import md5_signature

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '1': 0,  # 成功
    '0': 9,  # 未知错误
    '1001': 9,  # UserId错误
    '1002': 9,  # 认证错误
    '1004': 9,  # 用户名错误
    '1005': 9,  # 用户名为空
    '1006': 9,  # 密码为空
    '1007': 9,  # 密码错误
    '1008': 9,  # 源ip错误
    '1009': 9,  # 帐户已停用
    '1101': 9,  # 参数错误
    '1102': 9,  # 流量值错误
    '1103': 9,  # 号码为空
    '1104': 9,  # 号码错误
    '1201': 9,  # 没有配置产品
    '1202': 9,  # 无可用的通道
    '1203': 9,  # 不支持该流量包
    '1301': 9,  # 生成流量卡失败
    '1302': 9,  # 流量卡号错误
    '1311': 9,  # 流量卡已被使用
    '1312': 9,  # 号码运营商与流量卡不一致
    '1313': 9,  # 流量卡已过期
    '1401': 9,  # 计费失败
    '1402': 9,  # 计费错误
    '1403': 9,  # 不支持全国使用
    '1404': 9,  # 省份错误
    '9999': 9,  # 系统内部错误
}


@tornado.gen.coroutine
def up_lemian(handler, partner):
    handler.up_req_time = time.localtime()
    stamp = time.strftime("%m%d%H%M%S", handler.up_req_time)
    UserId = partner['UserId']
    UserName = partner['UserName']
    password = partner['password']
    Password = md5_signature(password+stamp)
    mobile = handler.mobile

    flow = None
    k = 'private:lemian:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    flow = handler.slave.get(k)

    if flow is None:
        handler.up_result = 5003
        return handler.up_result

    data = UserId+','+UserName+','+Password+','+mobile+','+flow+','+stamp
    secret = md5_signature(data)

    body = '&'.join([
        "UserId=%s" % quote(UserId),
        "UserName=%s" % quote(UserName),
        "Password=%s" % quote(Password),
        "mobile=%s" % quote(mobile),
        "flow=%s" % quote(flow),
        "stamp=%s" % quote(stamp),
        "secret=%s" % quote(secret),
    ])
    url = partner['url.order']
    url = url + '?' + body

    result = 9999
    up_result = None
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
            up_result = response_body.get("status")
            sp_order_id = response_body.get("msgid")
            handler.up_order_id = sp_order_id

            result = RESULT_MAP.get(up_result, 9)
            handler.up_result = up_result

            if handler.up_result == '1':
                handler.master.set("map:lemian:{sp_order_id}".format(sp_order_id=sp_order_id), handler.order_id)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result

















