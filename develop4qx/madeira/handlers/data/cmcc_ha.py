import calendar
import logging
import time
import json
from datetime import datetime

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from handlers.admin.encrypt import openplatform_sign


ORDER_FORMAT = 'app_id={app_id}&app_key={app_key}&grant_type={grant_type}'
ORDER_FORMAT_ACCESS = 'method={method}&format=json&appId={appId}&appKey={appKey}&busiSerial={busiSerial}&version=1.0&accessToken={accessToken}&timestamp={timestamp}&sign={sign}'

request_log = logging.getLogger("madeira.request")


RESULT_MAP = {
        "00000":    0,    # 服务调用成功
        "11002":    9,    #该请求必须用POST方法
        "12002":    9,    #response_type不能为空
        "12004":    9,    #Grant type不能为空
        "13001":    9,    #response type的值必须为code或者token
        "13002":    9,    #中心注册的回调地址和redirect_uri不一致
        "13003":    9,    #grant type值无效
        "13004":    9,    #用户拒绝授权
        "13005":    9,    #authorize_code过期，请重新授权
        "13009":    9,    #client_id(即appkey)不存在
        "13010":    9,    #应用的回调地址不合法
        "13011":    9,    #app存在黑名单中
        "14001":    9,    #协议不支持
        "20001":    99999,    #系统内部错误
        "20002":    9,    #重复的请求
        "20003":    9,    #HTTP方法被禁止(请使用POST或者GET)
        "20004":    9,    #服务不可用
        "20005":    9,    #远程服务出错
        "20101":    9,    #缺少必选参数
        "20102":    9,    #非法的参数
        "20103":    9,    #请求被禁止
        "20104":    9,    #参数错误
        "20201":    9,    #缺少方法名参数
        "20202":    9,    #非法的方法名参数
        "20203":    9,    #非法的数据格式参数
        "20204":    9,    #缺少签名参数
        "20205":    9,    #非法的签名参数
        "20206":    9,    #非法的签名方法参数
        "20207":    9,    #缺少会话参数
        "20208":    9,    #非法的会话参数
        "20209":    9,    #缺少时间戳参数
        "20210":    9,    #非法的时间戳参数
        "20211":    9,    #timestamp调用超时
        "20212":    9,    #非法的版本号参数
        "20213":    9,    #不支持的版本号
        "20214":    9,    #缺少abilityid参数
        "20215":    9,    #请求IP为空
        "20216":    9,    #模拟应答编码缺失
        "20217":    9,    #环境标识异常
        "20218":    9,    #流量控制超流量后停止服务
        "20219":    9,    #策略控制未找到匹配配额规则
        "20220":    9,    #配额控制超配额后停止服务
        "20221":    9,    #数字签名验证不通过
        "20301":    9,    #缺少appid参数
        "20302":    9,    #不存在的appid
        "20303":    9,    #Appid在黑名单中
        "20304":    9,    #应用超过使用限制
        "20305":    9,    #应用调用频率超过限制
        "20306":    9,    #应用超过使用权限
        "20307":    9,    #缺少Token参数
        "20308":    9,    #非法的Token参数
        "20309":    9,    #令牌过期
        "20310":    9,    #令牌超出使用限制
        "20311":    9,    #令牌调用频率超过限制
        "20312":    9,    #令牌超过使用权限
        "20313":    9,    #用户调用次数超限
        "20314":    9,    #会话调用次数超限
        "20315":    9,    #应用状态不合法
        "20316":    9,    #能力不存在
        "20317":    9,    #不存在(或无效)的应用能力绑定关系
        "20318":    9,    #应用调用的能力需要用户授权
        "20319":    9,    #能力参数未配置
        "20320":    9,    #解密请求报文失败
        "20321":    9,    #加密响应报文失败
        "20322":    9,    #能力参数为空
        "20323":    9,    #SOCKET请求报文头长度不对
        "20324":    9,    #SOCKET请求报文体参数或参数值缺失
        "20325":    9,    #报文格式不支持
        "20326":    9,    #参数长度错误
        "20327":    9,    #参数值不是数字型
        "20328":    9,    #能力处于非可用状态
        "20329":    9,    #参数值为空
        "20330":    9,    #参数值类型错误
        "20331":    9,    #参数模糊化错误
        "30001":    9,    #创建jms连接失败
        "30002":    9,    #创建session会话失败
        "30003":    9,    #获取session失败
        "30004":    9,    #根据会话和队列(通用)创建Producer失败
        "30500":    9,    #能力服务对应关系不存在
        "305001":   9,    #根据服务id获取流程模板出错
        "305002":   9,    #根据服务编码获取服务信息出错
        "305003":   9,    #传入参数错误
        "305004":   9,    #查询信息出错
        "305005":   9,    #服务流程模板调用出错
        "305006":   9,    #参数路径错误
        "305007":   9,    # [目前定义的编码长度为5位]	参数转换出错

}



# 过期时间
def expire():
    now = datetime.now()
    monthRange = calendar.monthrange(now.year, now.month)
    n = monthRange[1]
    sec = now.hour * 3600 + now.minute * 60 + now.second
    _expire = (n - now.day + 1) * 24 * 3600 - sec
    return _expire


# 产品编码
def mem_srvpkg(key):
    return {'30': 'A',
            '50': 'B',
            '70': 'C',
            '100': 'D',
            '130': 'E',
            '180': 'F',
            '280': 'G',
            '3': 'H',
            '5': 'I',
            '10': 'J',
            '20': 'K'}.get(key) or key


@tornado.gen.coroutine
def up_hacmcc(handler, partner):
    appId = partner["appId"]
    appKey = partner["appKey"]
    method = "SO_MEMBER_DEAL_OPER"  # 成员添加/变更/删除

    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    busiSerial = timestamp[-10:]
    handler.up_req_time = time.localtime()

    MEM_SRVPKG = None
    if handler.product == 'data':
        MEM_SRVPKG = mem_srvpkg(str(handler.price))

        if MEM_SRVPKG is None:
            handler.up_result = 5003
            return handler.up_result

    master = handler.master

    # 判断手机是不是集团用户
    k = 'hacmcc:user:{0}'.format(handler.mobile)
    time_now = datetime.now()
    last_time = master.get('hacmcc:user:{0}'.format(handler.mobile))

    if last_time == "processing":
        handler.up_resp_time = time.localtime()
        handler.up_result = '8000'
        return handler.up_result

    elif not last_time or last_time != time_now.strftime("%Y%m"):
        master.setex(k, expire(), "processing")
        FLAG = "1"
    else:
        FLAG = "4"

    key = "auth:hacmcc:token"
    access_token = master.get(key)
    if not access_token:
        url = partner["url_auth"]
        body = ORDER_FORMAT.format(
            app_id=appId,
            app_key=appKey,
            grant_type="client_credentials"
        )

        try:
            http_client = AsyncHTTPClient()
            request_log.info("REQU %s", body, extra={'orderid': handler.order_id})
            response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)

        except HTTPError as http_error:
            request_log.exception('CALL UPSTREAM FAIL', extra={'orderid': handler.order_id})
            result = 60000 + http_error.code
            return result

        except Exception as e:
            request_log.exception('GET TOKEN FAIL', extra={'orderid': handler.order_id})
            response = None


        if response and response.code == 200:
            response_body = response.body.decode('utf8')
            request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})

            response_body = json.loads(response_body)
            access_token = response_body['access_token']
            master.setex(key, 60000, access_token)

    BILL_ID = handler.mobile
    CUST_ORDER_ID = handler.order_id
    GBILL_ID = partner["GBILL_ID"]

    # 业务参数
    busi_body = {
        "GBILL_ID": GBILL_ID,
        "FLAG": FLAG,
        "BILL_ID": BILL_ID,
        "VALID_MONTH": "1",
        "MEM_SRVPKG": MEM_SRVPKG,
        "CUST_ORDER_ID": CUST_ORDER_ID,
        "SMS_TEMPLATE": '1'
    }

    busi_body = json.dumps(busi_body)
    sys_param = {"method": method,
                 "format": "json",
                 "timestamp": timestamp,
                 "appId": appId,
                 "appKey": appKey,
                 "version": "1.0",
                 "accessToken": access_token,
                 "busiSerial": busiSerial
                 }

    sign = openplatform_sign(sys_param, busi_body, appKey)

    # busi_param = aes(busi_body, appKey) #业务参数明文发送

    # 系统参数
    sys_body = ORDER_FORMAT_ACCESS.format(
        method=method,
        appId=appId,
        accessToken=access_token,
        sign=sign,
        timestamp=timestamp,
        busiSerial=busiSerial,
        appKey=appKey
    )

    url_busi = partner['url_busi']

    url = url_busi + "?" + sys_body

    request_log.info('CALL_REQ %s', sys_body, extra={'orderid': handler.order_id})
    request_log.info('CALL_REQ %s', busi_body, extra={'orderid': handler.order_id})


    try:
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(url, method='POST', body=busi_body, request_timeout=120)

    except HTTPError as http_error:
        request_log.exception('CALL UPSTREAM FAIL', extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        return result

    except Exception as e:
        request_log.exception('CALL UPSTREAM FAIL', extra={'orderid': handler.order_id})
        response = None

    result = 9999
    up_result = None
    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            response_body = json.loads(response_body)
            up_result = response_body["respCode"]
            handler.up_result = up_result
            if up_result == '00000':
                result = RESULT_MAP.get(up_result, 9)
            elif up_result in ["20308", "20309"]:
                master.delete(key)
                result = yield up_hacmcc(handler, partner)
            elif up_result == '10017':
                result = RESULT_MAP.get(up_result, 9)
            else:
                request_log.error("UNKNOWN CODE %s", up_result)
                result = 9
        except Exception as e:
            result = 9999
            request_log.exception('PARSE UPSTREAM', extra={'orderid': handler.order_id})

    return result
