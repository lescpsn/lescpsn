import logging
import time
from xml.etree import ElementTree

import tornado

import tornado.gen

from tornado.httpclient import AsyncHTTPClient

from handlers import signature

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    100: 0,
    256: 5003,
    601: 5003
}


@tornado.gen.coroutine
def up_yuechen(handler, partner):
    """联动通讯
        oid	商家订单编号	32	不可空	商户系统自己生成的订单号
        cid	商家编号	20	不可空	商户注册的时候产生的一个商户ID
        pr	单位面值	10	不可空	您所充值的单位商品面值
        nb	商品数量	1	不可空	您所需要充值的充值数量（固定为1）
        fm	充值金额	10	不可空	充值金额=商品面值*商品数量
        pn	充值号码	11	不可空	您所需要充值的帐号信息
        ct	充值类型		可以空	充值类型，缺省为快充
        ru	通知地址		不可空	通知地址,根据协议2.4充值结果通知，返回充值结果
        tsp	时间戳	14	不可空	请求时间戳，格式yyyyMMddHHmmss
        info1	扩展参数I	128	可以空
        info1	扩展参数II	128	可以空
        info1	扩展参数III	128	可以空
        sign	签名		不可空	原串拼接规则:
        md5({oid}{cid}{pr}{nb}{fm}{pn}{ru}{tsp}{key})
    """
    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())

    # print(partner['key'])
    # sign md5({oid}{cid}{pr}{nb}{fm}{pn}{ru}{tsp}{key})
    sign = signature(handler.order_id,
                     partner['cid'],
                     handler.price,
                     '1',
                     handler.price,
                     handler.mobile,
                     partner['ru'],
                     tsp,
                     partner['key'])

    # package
    url = '{url}?oid={oid}&cid={cid}&pr={pr}&nb=1&fm={pr}&pn={pn}&ru={ru}&tsp={tsp}&sign={sign}'.format(
        url=partner['url.order'],
        oid=handler.order_id,
        cid=partner['cid'],
        pr=handler.price,
        pn=handler.mobile,
        # ru=urllib.parse.quote(partner['ru']),
        ru=partner['ru'],
        tsp=tsp,
        sign=sign)

    request_log.info('CALL_REQ YUECHEN %s', url, extra={'orderid': handler.order_id})

    # call & wait
    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, connect_timeout=30, request_timeout=30)

    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    result = 9999
    if response and response.code == 200:
        body = response.body.decode('gbk')
        request_log.info('CALL_RESP (%d) %s', response.code, body, extra={'orderid': handler.order_id})

        root = ElementTree.fromstring(body)
        if root.find('result').text == 'true' and root.find('code').text == '100':

            result = int(root.find('code').text)
            handler.up_order_id = root.find('data/sid').text
            handler.result = RESULT_MAP.get(result, result)
        else:
            result = int(root.find('code').text)
            handler.result = RESULT_MAP.get(result, result)

    return handler.result
