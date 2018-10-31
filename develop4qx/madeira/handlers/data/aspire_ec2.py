# encoding: utf8
import logging
import re
import base64
from datetime import datetime
import time
import hashlib

import tornado.gen
from tornado.httpclient import HTTPRequest, AsyncHTTPClient, HTTPError
from tornado.ioloop import IOLoop

from handlers.data.aspire_ec_callback2 import do_aspire_ec_order_result

request_log = logging.getLogger("madeira.request")

NEW_MEM_ORDER_FORMAT2 = '''------------------314159265358979323846
Content-Disposition: form-data; name="xmlhead"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>0</TestFlag><BIPType><BIPCode>BIP4B874</BIPCode><ActivityCode>T4011135</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{SessionID}</SessionID><TransIDO>{Prefix}{TransIDO}/TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
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

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>0</TestFlag><BIPType><BIPCode>BIP4B874</BIPCode><ActivityCode>T4011135</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{Prefix}{SessionID}</SessionID><TransIDO>{Prefix}{TransIDO}</TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
------------------314159265358979323846
Content-Disposition: form-data; name="xmlbody"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?>
<InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="utf-8"?><UserInfo><ProductID>{ProductID}</ProductID><UserData><MobNum>{MobNum}</MobNum><OprCode>01</OprCode><UserPackage>{UserPackage}</UserPackage><ValidMonths>1</ValidMonths></UserData><EffRule>0</EffRule></UserInfo>]]> </SvcCont></InterBOSS>
------------------314159265358979323846--
'''


OLD_MEM_ORDER_FORMAT = '''<UserData><MobNum>{MobNum}</MobNum><UserPackage>{UserPackage}</UserPackage></UserData>'''
OLD_MEM_ORDER_LIST_FORMAT = '''------------------314159265358979323846
Content-Disposition: form-data; name="xmlhead"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><Version>0100</Version><TestFlag>0</TestFlag><BIPType><BIPCode>BIP4B876</BIPCode><ActivityCode>T4011137</ActivityCode><ActionCode>0</ActionCode></BIPType><RoutingInfo><OrigDomain>STKP</OrigDomain><RouteType>00</RouteType><Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo><TransInfo><SessionID>{Prefix}{SessionID}</SessionID><TransIDO>{Prefix}{TransIDO}</TransIDO><TransIDOTime>{TransIDOTime}</TransIDOTime></TransInfo></InterBOSS>
------------------314159265358979323846
Content-Disposition: form-data; name="xmlbody"
Content-Type: text/plain; charset=US-ASCII
Content-Transfer-Encoding: 8bit

<?xml version="1.0" encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA[<?xml version="1.0" encoding="utf-8"?><AdditionInfo><ProductID>{ProductID}</ProductID>{OrderList}</AdditionInfo>]]> </SvcCont></InterBOSS>
------------------314159265358979323846--
'''


#1.先将订单缓存到订单池

@tornado.gen.coroutine
def up_aspire_ec2(handler, partner):
    #获取单个订单的基本参数
    result = 99999
    handler.up_req_time = time.localtime()

    # 查询产品ID
    product_config = handler.slave.hgetall(
            'private:aspire_ec:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price))
    if not product_config:
        request_log.error('ASPIRE_EC QUERY PRODUCT INFO FAIL1'.format(handler.order_id),
                          extra={'orderid': handler.order_id})
        return result

    package_id = product_config.get('package_id')
    if not package_id:
        request_log.error('ASPIRE_EC QUERY PRODUCT INFO FAIL2'.format(handler.order_id),
                          extra={'orderid': handler.order_id})
        return result

    #判断当前订单池是否为空
    last_up_tsp = int( handler.slave.get('aspire_ec:last_up_tsp') or 0 )
    order_pool_list = handler.slave.keys('aspire_ec:order:*')
    if len(order_pool_list) == 0 or int(time.time() ) - last_up_tsp > 2:
        #订单池为空设置两秒后触发发送订单池里面的所有订单
        IOLoop.instance().call_later(2, up_aspire_ec_driver, handler, partner)


    #判断订单池中是否已经存在该号码的订单
    if handler.slave.exists( 'aspire_ec:order:{0}'.format(handler.mobile) ):
        request_log.error('ASPIRE_EC MOBILE ALERADY IN POOL'.format(handler.order_id),
                  extra={'orderid': handler.order_id})
        return 10033

    #组装订单内容
    order_content = OLD_MEM_ORDER_FORMAT.format(MobNum=handler.mobile, UserPackage=package_id)

    #将订单缓存到订单池中
    handler.master.hmset( 'aspire_ec:order:{0}'.format(handler.mobile), {
        'mobile': handler.mobile,
        'order_id': handler.order_id,
        'order_content': order_content,
    })

    #返回充值中
    return 0

@tornado.gen.coroutine
def up_aspire_ec_driver(handler, partner):
    order_pool_list = handler.slave.keys('aspire_ec:order:*')
    if len(order_pool_list) == 0:
        return

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

    SessionID = handler.order_id
    SessionID = SessionID[::-1]
    TransIDO = handler.order_id
    TransIDOTime = datetime.now().strftime("%Y%m%d%H%M%S")
    Prefix = partner["prefix"]

    #订单池机制不支持单纯的新增成员操作
    # mem_check = handler.master.get('aspire_ec:mobile:%s' % handler.mobile)
    # if mem_check == datetime.now().strftime("%Y%m") or True:
    #     ORDER_FORMAT = OLD_MEM_ORDER_FORMAT
    # else:
    #     ORDER_FORMAT = NEW_MEM_ORDER_FORMAT

    #组装订单池中的所有订单
    mobile_order_id_map = {}
    order_list_content = ''
    for order_key in order_pool_list:
        order_info = handler.slave.hgetall(order_key)
        request_log.info('ASPIRE_EC ORDER IN POOL [{0}]'.format(handler.order_id), extra={'orderid': order_info['order_id']})

        order_list_content += order_info['order_content']
        mobile_order_id_map[ order_info['mobile'] ] = order_info['order_id']

        handler.master.delete(order_key) #清理redis


    order = OLD_MEM_ORDER_LIST_FORMAT.format(SessionID=SessionID, TransIDO=TransIDO, TransIDOTime=TransIDOTime, ProductID=user_id,
                                OrderList=order_list_content, Prefix=Prefix)

    Status = None
    OperSeq = None
    RspCode = None
    http_client = AsyncHTTPClient()

    try:
        request_log.info('ASPIRE_EC CALL_REQ1 %s', order, extra={'orderid': handler.order_id})
        request_log.info('ASPIRE_EC CALL_REQ2 %s - %s', url, headers, extra={'orderid': handler.order_id})

        request = HTTPRequest(url=url, method='POST', headers=headers, body=order)

        response = yield http_client.fetch(request, request_timeout=120)
        response = ''.join(response.body.decode().split())
        request_log.info('ASPIRE_EC CALL_RESP %s', response, extra={'orderid': handler.order_id})

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

        if Status == '00':
            #订单发送成功 等待上游回调结果
            for mobile in mobile_order_id_map:
                request_log.info('ASPIRE_EC UPORDER SUCCESS, ORDERSEQ [{0}]'.format(OperSeq), extra={'orderid': mobile_order_id_map[mobile]})
                handler.master.set('map:aspire_ec:{0}:{1}'.format(OperSeq, mobile), mobile_order_id_map[mobile])

        else:
            result = 60000
            if RspCode:
                result += int(RspCode)
            elif Status:
                RspCode += int(Status)

            for mobile in mobile_order_id_map:
                order_id = mobile_order_id_map[mobile]
                request_log.error('ASPIRE_EC UPORDER FAIL', extra={'orderid': order_id})

                #订单收到失败的结果， 直接返回失败
                yield do_aspire_ec_order_result(handler, order_id, result)

    # 超时订单特殊处理
    except HTTPError as http_error:
        for mobile in mobile_order_id_map:
            order_id = mobile_order_id_map[mobile]
            request_log.exception('ASPIRE_EC UPORDER HTTP EXCEPTION', extra={'orderid': order_id})
            #卡单需要人工处理

    except Exception as e:
        for mobile in mobile_order_id_map:
            order_id = mobile_order_id_map[mobile]
            request_log.exception('ASPIRE_EC UPORDER EXCEPTION', extra={'orderid': order_id})
            #卡单需要人工处理

