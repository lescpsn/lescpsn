# encoding: utf8
import logging
import re
import base64
from datetime import datetime
import time
import hashlib

import tornado.gen
from tornado.httpclient import HTTPRequest, AsyncHTTPClient, HTTPError

request_log = logging.getLogger("madeira.request")

NEW_MEM_ORDER_FORMAT2 = '''------------------314159265358979323846
Content-Disposition: form-data; name="xmlhead"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>0</TestFlag><BIPType><BIPCode>BIP4B874</BIPCode><ActivityCode>T4011135</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{SessionID}</SessionID><TransIDO>{DXHL}{TransIDO}/TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
------------------314159265358979323846
Content-Disposition: form-data; name="xmlbody"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="utf-8"?><UserInfo><ProductID>{ProductID}</ProductID><UserData><MobNum>{MobNum}</MobNum><OprCode>01</OprCode><UserPackage>{UserPackage}</UserPackage><UsageLimit></UsageLimit><ValidMonths>1</ValidMonths></UserData><EffRule>0</EffRule></UserInfo>]]> </SvcCont></InterBOSS>
------------------314159265358979323846--
'''

NEW_MEM_ORDER_FORMAT = '''------------------314159265358979323846
Content-Disposition: form-data; name="xmlhead"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>0</TestFlag><BIPType><BIPCode>BIP4B874</BIPCode><ActivityCode>T4011135</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{DXHL}{SessionID}</SessionID><TransIDO>{DXHL}{TransIDO}</TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
------------------314159265358979323846
Content-Disposition: form-data; name="xmlbody"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?>
<InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="utf-8"?><UserInfo><ProductID>{ProductID}</ProductID><UserData><MobNum>{MobNum}</MobNum><OprCode>01</OprCode><UserPackage>{UserPackage}</UserPackage><ValidMonths>1</ValidMonths></UserData><EffRule>0</EffRule></UserInfo>]]> </SvcCont></InterBOSS>
------------------314159265358979323846--
'''

OLD_MEM_ORDER_FORMAT = '''------------------314159265358979323846
Content-Disposition: form-data; name="xmlhead"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>0</TestFlag><BIPType><BIPCode>BIP4B876</BIPCode><ActivityCode>T4011137</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{DXHL}{SessionID}</SessionID><TransIDO>{DXHL}{TransIDO}</TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
------------------314159265358979323846
Content-Disposition: form-data; name="xmlbody"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="utf-8"?><AdditionInfo><ProductID>{ProductID}</ProductID><UserData><MobNum>{MobNum}</MobNum><UserPackage>{UserPackage}</UserPackage></UserData></AdditionInfo>]]> </SvcCont></InterBOSS>
------------------314159265358979323846--
'''


@tornado.gen.coroutine
def up_aspire_ec(handler, partner):
    result = 99999
    handler.up_req_time = time.localtime()

    # 查询产品ID
    product_config = handler.slave.hgetall(
            'private:aspire_ec:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price))
    if not product_config:
        request_log.error('{0} ASPIREC QUERY PRODUCT INFO FAIL1'.format(handler.order_id),
                          extra={'orderid': handler.order_id})
        return result

    package_id = product_config.get('package_id')
    if not package_id:
        request_log.error('{0} ASPIREC QUERY PRODUCT INFO FAIL2'.format(handler.order_id),
                          extra={'orderid': handler.order_id})
        return result

    user_id = partner['userid']
    url = partner['url.order']
    app_key = partner['app_key']
    app_secret = partner['app_secret']

    nonce = handler.order_id

    created_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")

    password_digest = base64.b64encode(
            hashlib.sha256((nonce + created_time + app_secret).encode()).hexdigest().encode()).decode()
    nonce = base64.b64encode(nonce.encode()).decode()

    h1 = 'UsernameToken Username="{Username}",PasswordDigest="{PasswordDigest}", Nonce="{Nonce}", Created="{Created_time}"'.format(
            Username=app_key,
            PasswordDigest=password_digest,
            Nonce=nonce,
            Created_time=created_time,
    )

    headers = {
        'X-WSSE': h1,
        'Authorization': 'WSSE realm="DOMS", profile="UsernameToken", type="AppKey"',
        'Content-Type': 'multipart/form-data; boundary=----------------314159265358979323846',
    }

    mobile = handler.mobile

    SessionID = handler.order_id
    SessionID = SessionID[::-1]
    TransIDO = handler.order_id
    TransIDOTime = datetime.now().strftime("%Y%m%d%H%M%S")
    DXHL = partner["prefix"]

    mem_check = handler.master.get('aspire_ec:mobile:%s' % handler.mobile)
    if mem_check == datetime.now().strftime("%Y%m") or True:
        ORDER_FORMAT = OLD_MEM_ORDER_FORMAT
    else:
        ORDER_FORMAT = NEW_MEM_ORDER_FORMAT

    order = ORDER_FORMAT.format(SessionID=SessionID, TransIDO=TransIDO, TransIDOTime=TransIDOTime, ProductID=user_id,
                                MobNum=mobile, UserPackage=package_id, DXHL=DXHL)

    Status = None
    OperSeq = None
    RspCode = None
    http_client = AsyncHTTPClient()

    try:
        request_log.info('CALL_REQ %s', order, extra={'orderid': handler.order_id})
        request_log.info('CALL_REQ %s - %s', url, headers, extra={'orderid': handler.order_id})

        request = HTTPRequest(url=url, method='POST', headers=headers, body=order)

        response = yield http_client.fetch(request, request_timeout=120)
        response = ''.join(response.body.decode().split())
        request_log.info('CALL_RESP %s', response, extra={'orderid': handler.order_id})

        Status_result = re.search(r'<Status>(.*)</Status>', response)
        if Status_result and len(Status_result.groups()):
            Status = Status_result.groups()[0]

        OperSeq_result = re.search(r'<OperSeq>(.*)</OperSeq>', response)
        if OperSeq_result and len(OperSeq_result.groups()):
            OperSeq = OperSeq_result.groups()[0]

        RspCode_result = re.search(r'<RspCode>(.*)</RspCode>', response)
        if RspCode_result and len(RspCode_result.groups()):
            RspCode = RspCode_result.groups()[0]

        ErrDesc_result = re.search(r'<ErrDesc>(.*)</ErrDesc>', response)
        if ErrDesc_result and len(ErrDesc_result.groups()):
            ErrDesc = ErrDesc_result.groups()[0]

    # 超时订单特殊处理
    except HTTPError as http_error:
        request_log.exception('CALL ASPIRE_EC FAIL', extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        return result

    except Exception as e:
        request_log.exception('ASPIRE_EC UPORDER EXCEPTION', extra={'orderid': handler.order_id})

    if Status == '00':
        result = 0
        handler.master.set('map:aspire_ec:%s' % OperSeq, handler.order_id)
    else:
        result = 60000
        if RspCode:
            result += int(RspCode)
        elif Status:
            RspCode += int(Status)

    return result


# 成员查询
@tornado.gen.coroutine
def query_member(handler, partner, url, headers, package_id):
    SessionID = handler.order_id
    SessionID = SessionID[::-1]
    TransIDO = handler.order_id
    TransIDOTime = datetime.now().strftime("%Y%m%d%H%M%S")
    DXHL = partner["transido_prefic"]
    mobile = handler.mobile
    MonthSpec = time.strftime("%Y%m", time.localtime())

    QUERY_ORDER_FORMAT = '''------------------314159265358979323846
        Content-Disposition: form-data; name="xmlhead"
        Content-Type: text/plain; charset=US-ASCII
        Content-Transfer-Encoding: 8bit

        <?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>1</TestFlag><BIPType><BIPCode>BIP4B901</BIPCode><ActivityCode>T4011153</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{DXHL}{SessionID}</SessionID><TransIDO>{DXHL}{TransIDO}</TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
        ------------------314159265358979323846
        Content-Disposition: form-data; name="xmlbody"
        Content-Type: text/plain; charset=US-ASCII
        Content-Transfer-Encoding: 8bit

        <?xml version="1.0" encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="UTF-8"?><MemberOrdQuery><QuerySequence>{QuerySequence}</QuerySequence><ProductID>{ProductID}</ProductID><MSISDN>{MSISDN}</MSISDN><MonthSpec>{MonthSpec}</MonthSpec></MemberOrdQuery>]]></SvcCont></InterBOSS>
        ------------------314159265358979323846--
        '''
    order = QUERY_ORDER_FORMAT.format(SessionID=SessionID, TransIDO=TransIDO, TransIDOTime=TransIDOTime,
                                      QuerySequence=handler.order_id,
                                      ProductID=package_id, MSISDN=mobile, MonthSpec=MonthSpec, DXHL=DXHL)

    request = HTTPRequest(url=url, method='POST', headers=headers, body=order)

    request_log.info('CALL_REQ %s', request.body.decode(), extra={'orderid': handler.order_id})
    response = None
    try:
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(request)
        response = ''.join(response.body.decode().split())
        request_log.info('QUERY_MEMBER_CALL_RESP %s', response, extra={'orderid': handler.order_id})
    except Exception as e:
        request_log.error('ASPIRE_EC QUERY_MEMBER EXCEPTION：{0}'.format(e))
        request_log.error('ASPIRE_EC QUERY_MEMBER EXCEPTION')

    return response


# 订单查询
@tornado.gen.coroutine
def query_order(handler, partner, url, headers):
    SessionID = handler.order_id
    SessionID = SessionID[::-1]
    TransIDO = handler.order_id
    TransIDOTime = datetime.now().strftime("%Y%m%d%H%M%S")
    DXHL = partner["transido_prefic"]

    QUERY_ORDER_FORMAT = '''------------------314159265358979323846
        Content-Disposition: form-data; name="xmlhead"
        Content-Type: text/plain; charset=US-ASCII
        Content-Transfer-Encoding: 8bit

        <?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>1</TestFlag><BIPType><BIPCode>BIP4B907</BIPCode><ActivityCode>T4011162</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{DXHL}{SessionID}</SessionID><TransIDO>{DXHL}{TransIDO}</TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
        ------------------314159265358979323846
        Content-Disposition: form-data; name="xmlbody"
        Content-Type: text/plain; charset=US-ASCII
        Content-Transfer-Encoding: 8bit

        <?xml version="1.0" encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="utf-8"?><QryInfo><OrigTransIDO>{OrigTransIDO}</OrigTransIDO></QryInfo>]]></SvcCont></InterBOSS>
        ------------------314159265358979323846--
        '''
    order = QUERY_ORDER_FORMAT.format(SessionID=SessionID, TransIDO=TransIDO, TransIDOTime=TransIDOTime,
                                      OrigTransIDO=handler.order_id, DXHL=DXHL)

    request = HTTPRequest(url=url, method='POST', headers=headers, body=order)

    request_log.info('CALL_REQ %s', request.body.decode(), extra={'orderid': handler.order_id})
    response = None
    try:
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(request)
        response = ''.join(response.body.decode().split())
        request_log.info('QUERY_ORDER_CALL_RESP %s', response, extra={'orderid': handler.order_id})
    except Exception as e:
        request_log.error('ASPIRE_EC QUERY_MEMBER EXCEPTION：{0}'.format(e))
        request_log.error('ASPIRE_EC QUERY_MEMBER EXCEPTION')

    return response
