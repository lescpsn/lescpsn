# 华为移动接口
import hashlib
import logging
import time
import xml.etree.ElementTree as ET

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '1100020000': 0,  # 成功
    '1100020001': 9,  # 失败
    '1100020002': 9,  # 系统内部错误
    '1100020003': 9,  # 参数校验失败
    '1100020999': 9,  # 未知错误
}


@tornado.gen.coroutine
def up_migu_huawei(handler, partner):
    timeStamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    sourceDeviceCode = partner["sourceDeviceCode"]
    sharedSecret = partner["sharedSecret"]
    authenticatorSource = sourceDeviceCode + sharedSecret + timeStamp
    authenticatorSource = hashlib.sha256(authenticatorSource.encode(encoding='gb2312')).hexdigest()

    headers = {
        'sourceDeviceCode': sourceDeviceCode,
        'timeStamp': timeStamp,
        'authenticatorSource': authenticatorSource,
        'version': '1.0',
    }

    REQUEST_IMPL = ("<implicitAuthenticateUserReq>"
                    "<userID>"
                    "<ID>{ID}</ID>"
                    "<type>0</type>"
                    "</userID>"
                    "</implicitAuthenticateUserReq>")

    REQUEST_COLOR = (
        "<executeCampaignReq>"
        "<campaignTypes>"
        "<int>2</int>"
        "</campaignTypes>"
        "<campaignIds>"
        "<string>zytcypkg</string>"
        "</campaignIds>"
        "<triggerEvent>5</triggerEvent>"
        "<triggeringTime>{triggeringTime}</triggeringTime>"
        "<currentUser>"
        "<userId>{userId}</userId>"
        "</currentUser>"
        "<queryType>4</queryType>"
        "<extendedInfo>"
        "<extendedParameter>"
        "<key>contentnum</key>"
        "<value class ='string'>20000100</value>"
        "</extendedParameter>"
        "</extendedInfo>"
        "<scopeCondition>"
        "<extendedInfo>"
        "<extendedParameter>"
        "<key>requestIP</key>"
        "<value class ='string'>1.1.1.1</value>"
        "</extendedParameter>"
        "<extendedParameter>"
        "<key>platform</key>"
        "<value class ='string'>62</value>"
        "</extendedParameter>"
        "</extendedInfo>"
        "</scopeCondition>"
        "</executeCampaignReq>"
    )

    REQUEST_FLOW = (
        "<executeCampaignReq>"
        "<campaignTypes>"
        "<int>2</int>"
        "</campaignTypes>"
        "<campaignIds>"
        "<string>zyt100M</string>    "
        "</campaignIds>"
        "<triggerEvent>5</triggerEvent>"
        "<triggeringTime>{triggeringTime}</triggeringTime>"
        "<currentUser>"
        "<userId>{userId}</userId>"
        "</currentUser>"
        "<queryType>4</queryType>"
        "<extendedInfo>"
        "<extendedParameter>"
        "<key>contentnum</key>"
        "<value class ='string'>20000100</value>"
        "</extendedParameter>"
        "</extendedInfo>"
        "<scopeCondition>"
        "<extendedInfo>"
        "<extendedParameter>"
        "<key>requestIP</key>"
        "<value class ='string'>1.1.1.1</value>"
        "</extendedParameter>"
        "<extendedParameter>"
        "<key>platform</key>"
        "<value class ='string'>62</value>"
        "</extendedParameter>"
        "</extendedInfo>"
        "</scopeCondition>"
        "</executeCampaignReq>"
    )

    REQUEST_AUTH = (
        "<authSubscriptionReq>"
        "<userID>"
        "<ID>{ID}</ID>"
        "<type>0</type>"
        "</userID>"
        "<objectID>200000000833</objectID>"
        "<extensionInfo>"
        "<namedParameter>"
        "<key>objectType</key>"
        "<value>1</value>"
        "</namedParameter>"
        "</extensionInfo>"
        "</authSubscriptionReq>"
    )

    REQUEST_CHECK = (
        "<checkBlackUserReq>"
        "<userIDList>"
        "<userID>"
        "<ID>{ID}</ID>"
        "<type>0</type>"
        "</userID>>"
        "</userIDList>>"
        "<extensionInfo>"
        "<namedParameter>"
        "<key>ruleID</key>"
        "<value>3</value>"
        "</namedParameter>"
        "</extensionInfo>>"
        "</checkBlackUserReq>"
    )


    #验证用户是否在黑名单
    body = REQUEST_CHECK.format(
        ID=handler.mobile
    )
    url = partner["url_check"]
    request = HTTPRequest(headers=headers, url=url, method='POST', body=body, request_timeout=120)

    http_client = AsyncHTTPClient()
    try:
        request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(request)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            root = ET.fromstring(response_body)
            ID = root.find('blackUserInfoList/blackUserInfo/userID/ID').text
            if ID:
                request_log.info('USER %s IN BlackUserInfoList', ID, extra={'orderid': handler.order_id})
                return
        except Exception as e:
            request_log.info('User %s is not on the black list', handler.mobile, extra={'orderid': handler.order_id})


    #验证用户是否已经订购
    body = REQUEST_AUTH.format(
        ID=handler.mobile
    )
    url = partner["url_auth"]
    request = HTTPRequest(headers=headers, url=url, method='POST', body=body, request_timeout=120)

    http_client = AsyncHTTPClient()
    try:
        request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(request)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            root = ET.fromstring(response_body)
            respCode = root.find('result/resultCode').text
            if respCode == "01557219":
                request_log.info('USER CAN SUBSCRIBE', extra={'orderid': handler.order_id})
            else:
                request_log.info('USER IS SUBSCRIBED', extra={'orderid': handler.order_id})
                return
        except Exception as e:
            request_log.error('GET userID FAIL %s', e, extra={'orderid': handler.order_id})

    #隐式鉴权
    body = REQUEST_IMPL.format(
        ID=handler.mobile
    )
    url = partner["url_impl"]
    request = HTTPRequest(headers=headers, url=url, method='POST', body=body, request_timeout=120)

    http_client = AsyncHTTPClient()
    try:
        request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(request)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    userId = None
    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            root = ET.fromstring(response_body)
            print(response_body)
            n = 0
            namedParameter = root.findall('extensionInfo/namedParameter')
            for key in namedParameter:
                value = key.find('key').text
                if value == 'ucid':
                    n = namedParameter.index(key)
                    break
            userId = namedParameter[n].find('value').text
        except Exception as e:
            request_log.error('GET USERID FAIL %s', e, extra={'orderid': handler.order_id})

    #赠送动漫包
    body = REQUEST_COLOR.format(
        triggeringTime=timeStamp,
        userId=userId
    )
    url = partner["url_exec"]
    request = HTTPRequest(headers=headers, url=url, method='POST', body=body, request_timeout=120)

    http_client = AsyncHTTPClient()
    try:
        request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(request)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            root = ET.fromstring(response_body)
            respCode = root.find('resultInfoList/resultInfo/resultCode').text
            if respCode == "1100020000":
                request_log.info('COMIC SUCCESS', extra={'orderid': handler.order_id})
            else:
                request_log.info('COMIC FAIL', extra={'orderid': handler.order_id})
                return
        except Exception as e:
            request_log.error('COMIC FAIL %s', e, extra={'orderid': handler.order_id})

    #赠送流量吧包
    body = REQUEST_FLOW.format(
        triggeringTime=timeStamp,
        userId=userId
    )
    url = partner["url_exec"]
    request = HTTPRequest(headers=headers, url=url, method='POST', body=body, request_timeout=120)

    http_client = AsyncHTTPClient()
    try:
        request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})
        response = yield http_client.fetch(request)
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None
    finally:
        http_client.close()

    result = 9999
    if response and response.code == 200:
        response_body = response.body.decode('utf8')
        request_log.info("RESP %s", response_body, extra={'orderid': handler.order_id})
        try:
            root = ET.fromstring(response_body)
            respCode = root.find('resultInfoList/resultInfo/resultCode').text
            result = RESULT_MAP.get(respCode, 9)
            handler.up_result = str(result)
        except Exception as e:
            result = 9999
            handler.up_result = result
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if result == 0:
        yield handler.callback('1')
    elif result == 9:
        pass
    return result
