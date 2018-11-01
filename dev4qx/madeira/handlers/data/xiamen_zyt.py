import base64
import json
import logging
from urllib.parse import urlencode
import time

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    "1": 9,  # 发送失败
    "2": 9,  # 参数有误
    "3": 9,  # 非法渠道或者订单编号重复
    "6": 9,  # 请求状态异常，充值失败
    "5": 9,  # 加密失败
    "7": 9,  # 余额不足
    "8": 9,  # 找不到对应的产品或渠道折扣
    "9": 9,  # 请求失败
    "0": 0,  # 客户下单成功/订购成功
    "10229": 0,  # 订购中
    "10001": 90005,  # 空号/号码不存在
    "10010": 10010,  # 欠费/停机
    "10012": 10012,  # 号码已冻结或注销
    "10013": 10013,  # 黑名单客户
    "10018": 10016,  # 不能重复订购
    "10024": 10019,  # 业务互斥
    "10033": 10033,  # 在途工单
    "10057": 9,  # 号码归属地信息不正确
    "10058": 10058,  # 客户业务受限
    "10063": 10111,  # 用户状态异常
    "10074": 10074,  # 用户信息不存在
    "10225": 10225,  # 无主套餐
    "80004": 9,  # 解析接收报文异常
    "90001": 99999,  # 系统异常
    "90003": 9,  # 模拟异常报竣
    "10003": 9,  # 非法参数
    "10006": 9,  # 非法客户
    "10007": 9,  # 非法销售品
    "10008": 9,  # 非法请求流水号
    "10030": 9,  # 非法合同编号
    "10031": 9,  # 销售品未配置
    "10040": 9,  # 服务无权访问
    "10054": 9,  # 销售品配置异常
    "10081": 9,  # 销售品不存在
    "10091": 9,  # 回调地址未配置
    "10109": 9,  # 活动省份不存在
    "10230": 9,  # 重复请求流水号
    "10236": 9,  # 无订购记录，重发失败
    "10237": 9,  # 订购已成功，无需重发
    "80002": 9,  # 网络异常
    "99999": 99999,  # 系统未知错误
}


@tornado.gen.coroutine
def up_xiamen_zyt(handler, partner):
    handler.up_req_time = time.localtime()

    timeStamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    requesttime = timeStamp
    msisdn = handler.mobile
    orderno = handler.order_id
    channelNo = partner['channelNo']
    key = partner["key"]

    productid = None
    k = 'private:telecom800:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price)
    productid = handler.slave.get(k)

    if productid is None:
        handler.up_result = 5003
        return handler.up_result

    data = 'channelNo={0}&msisdn={1}&orderno={2}&productid={4}&requesttime={3}&key={5}'.format(
            channelNo, msisdn, orderno, requesttime, productid, key)

    data_md5 = to_md5(data)
    bytesString = data_md5.encode(encoding="utf-8")

    sign = base64.b64encode(bytesString).decode('gb2312')

    body = {
        "channelNo": channelNo,
        "msisdn": msisdn,
        "productid": productid,
        "requesttime": requesttime,
        "orderno": orderno,
        "sign": sign
    }

    body = urlencode(body)

    url = partner["url_busi"]

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
            up_result = response_body["resultcode"]
            handler.up_result = str(up_result)
            result = RESULT_MAP.get(up_result, 9)


        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})
    return result
