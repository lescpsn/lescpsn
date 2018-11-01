import logging
import random
import time
import datetime
import json
from urllib.parse import quote_plus
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError
from tornado.ioloop import IOLoop
from utils.jsct import to_para

request_log = logging.getLogger("madeira.request")

PLAIN = 'accNbr={accNbr};offerSpecl={offerSpecl};actionCode=roder_qixin_001;goodName={goodName};ztInterSource={ztInterSource};reqId={reqId};staffValue={staffValue};type={type}'
QUERY = 'accNbr={accNbr};actionCode=roder_qixin_006;ztInterSource={ztInterSource};reqId={reqId}'

RESULT_MAP = {
    '0': 1,  # 成功
    '10900': 9,  # 不合法的请求,非信任IP
    '10003': 9,  # 其他异常导致的错误
    '100001': 9,  # 对不起，请检查输入的信息是否有误或咨询10000号
    '1000101': 9,  # 销售品ID未配置
    '1000102': 9,  # 您的库存不足
    '1000103': 9,  # 分销商未申请接入分销接口
    '1000104': 9,  # 数据验证未通过
    '1000105': 9,  # 参数格式异常
    '1000106': 9,  # 订购接口返回异常信息
    '1000107': 9,  # 号码归属地获取异常
    '1000108': 9,  # 激活码不存在或已使用
    '1000109': 9,  # 未知分销商！
}


@tornado.gen.coroutine
def up_telecom_js(handler, partner):
    handler.up_req_time = time.localtime()

    staffValue = partner["staffValue"]
    ztInterSource = partner["ztInterSource"]
    url_busi = partner["url_busi"]

    t = datetime.datetime.now()
    reqId = ztInterSource + t.strftime("%Y%m%d%H%M%S") + '%06d' % random.randint(0, 1000000)

    handler.up_order_id = reqId

    scope = handler.scope or '0'
    k = 'private:telecomjs:{scope}:{price}'.format(scope=scope, price=handler.price)
    offerSpecl, goodName = handler.slave.hmget(k, ['offerSpecl', 'goodName'])

    if offerSpecl is None:
        handler.up_result = 5003
        return handler.up_result

    plain = PLAIN.format(
            accNbr=handler.mobile,
            offerSpecl=offerSpecl,
            goodName=goodName,
            ztInterSource=ztInterSource,
            reqId=reqId,
            staffValue=staffValue,
            type="1"
    )

    para = to_para(plain).decode()
    body = 'para=' + quote_plus(para)
    url = url_busi

    result = 9999
    up_result = None

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
            up_result = str(response_body["TSR_RESULT"])
            handler.up_result = str(up_result)
            result = RESULT_MAP.get(up_result, 9)

        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    if result in [0, 60599]:
        for _ in range(5):
            result = yield query_order(reqId, partner, handler.order_id)
            if result in [1, 9]:
                break

            # wait
            yield tornado.gen.Task(IOLoop.instance().add_timeout, time.time() + 120)

    if result == 1:
        handler.back_result = result
        yield handler.callback('1')
    elif result == 9:
        pass

    return result


@tornado.gen.coroutine
def query_order(reqId, partner, order_id):
    result = 0

    staffValue = partner["staffValue"]
    ztInterSource = partner["ztInterSource"]
    url_query = partner["url_query"]

    query = QUERY.format(
            accNbr=staffValue,
            ztInterSource=ztInterSource,
            reqId=reqId
            # reqId = '20018620150917123036000001'
    )

    para = to_para(query).decode()
    body = 'para=' + quote_plus(para)
    url = url_query

    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)
        response_body = response.body.decode()
        request_log.info('QUERY_RESP %s', response_body, extra={'orderid': order_id})
        resp = json.loads(response_body)

        if "data" not in resp:
            result = 9
        else:
            state = resp["data"][0]["state"]

            if state == "1":
                result = 1
            else:
                result = 9

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': order_id})
    finally:
        http_client.close()

    return result
