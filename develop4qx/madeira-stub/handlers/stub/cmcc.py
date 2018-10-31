import base64
import codecs
import json
import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from Crypto.Cipher import AES

request_log = logging.getLogger("madeira.request")

FAIL = r''' <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><AdcServicesResponse xmlns="http://adc.ecinterface/"><AdcServicesResult><OrigDomain>NGEC</OrigDomain><BIPCode>EC0001</BIPCode><BIPVer>V1.0</BIPVer><TransIDO>Q2016011410084214325969</TransIDO><Areacode>GD</Areacode><ECCode>2000809954</ECCode><ECUserName>admini</ECUserName><ECUserPwd>ZJhjMeVDxKCb5mmtc/vFEodKHnL1eYEt</ECUserPwd><ProcessTime>20160114100842</ProcessTime><Response><RspCode>0000</RspCode><RspDesc>成功</RspDesc></Response>
<SvcCont>&lt;?xml version="1.0" encoding="utf-8"?&gt;&#xD;
&lt;MemberShipResponse&gt;&#xD;
  &lt;BODY&gt;&#xD;
    &lt;ECCode&gt;2000809954&lt;/ECCode&gt;&#xD;
    &lt;PrdOrdNum&gt;50815007127&lt;/PrdOrdNum&gt;&#xD;
    &lt;Member&gt;&#xD;
      &lt;Mobile&gt;15914437348&lt;/Mobile&gt;&#xD;
      &lt;ResultCode&gt;940003&lt;/ResultCode&gt;&#xD;
      &lt;ResultMsg&gt;集团成员号码[15914437348]已经是集团用户[87500001966428]的在用成员，不允许重复加入!&lt;/ResultMsg&gt;&#xD;
    &lt;/Member&gt;&#xD;
  &lt;/BODY&gt;&#xD;
&lt;/MemberShipResponse&gt;</SvcCont></AdcServicesResult></AdcServicesResponse></s:Body></s:Envelope>'''

SUCCESS = r'''<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><AdcServicesResponse xmlns="http://adc.ecinterface/"><AdcServicesResult><OrigDomain>NGEC</OrigDomain><BIPCode>EC0001</BIPCode><BIPVer>V1.0</BIPVer><TransIDO>Q2016011410084214325967</TransIDO><Areacode>GD</Areacode><ECCode>2000809954</ECCode><ECUserName>admini</ECUserName><ECUserPwd>ZJhjMeVDxKCb5mmtc/vFEodKHnL1eYEt</ECUserPwd><ProcessTime>20160114100842</ProcessTime><Response><RspCode>0000</RspCode><RspDesc>成功</RspDesc></Response>
<SvcCont>&lt;?xml version="1.0" encoding="utf-8"?&gt;&#xD;
&lt;MemberShipResponse&gt;&#xD;
  &lt;BODY&gt;&#xD;
    &lt;ECCode&gt;2000809954&lt;/ECCode&gt;&#xD;
    &lt;PrdOrdNum&gt;50815007127&lt;/PrdOrdNum&gt;&#xD;
    &lt;Member&gt;&#xD;
      &lt;Mobile&gt;13719354317&lt;/Mobile&gt;&#xD;
      &lt;CRMApplyCode&gt;80009636750529&lt;/CRMApplyCode&gt;&#xD;
      &lt;ResultCode&gt;1&lt;/ResultCode&gt;&#xD;
      &lt;ResultMsg /&gt;&#xD;
    &lt;/Member&gt;&#xD;
  &lt;/BODY&gt;&#xD;
&lt;/MemberShipResponse&gt;</SvcCont></AdcServicesResult></AdcServicesResponse></s:Body></s:Envelope>'''

EC05 = r'''<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><ECServices xmlns="http://ECService.EC.webservice.whty.com"><request><BIPCode xmlns="http://ECService.EC.webservice.whty.com/xsd">EC0005</BIPCode><BIPVer xmlns="http://ECService.EC.webservice.whty.com/xsd">V 1.0</BIPVer><ECCode xmlns="http://ECService.EC.webservice.whty.com/xsd">2000809954</ECCode><ECUserName xmlns="http://ECService.EC.webservice.whty.com/xsd">admini</ECUserName><ECUserPwd xmlns="http://ECService.EC.webservice.whty.com/xsd">ZJhjMeVDxKCb5mmtc/vFEodKHnL1eYEt</ECUserPwd><areacode xmlns="http://ECService.EC.webservice.whty.com/xsd">750</areacode><origDomain xmlns="http://ECService.EC.webservice.whty.com/xsd">NGADC</origDomain><processTime xmlns="http://ECService.EC.webservice.whty.com/xsd">20160114101240</processTime><response xsi:nil="true" xmlns="http://ECService.EC.webservice.whty.com/xsd" /><svcCont xmlns="http://ECService.EC.webservice.whty.com/xsd">&lt;NGMemberRequest&gt;
&lt;BODY&gt;
&lt;ECCode&gt;2000809954&lt;/ECCode&gt;
&lt;PrdOrdNum&gt;50815007127&lt;/PrdOrdNum&gt;
&lt;Member&gt;
&lt;OptType&gt;0&lt;/OptType&gt;
&lt;Mobile&gt;13719354317&lt;/Mobile&gt;
&lt;UserName&gt;13719354317&lt;/UserName&gt;
&lt;CRMApplyCode&gt;80009636750529&lt;/CRMApplyCode&gt;
&lt;PrdList&gt;
&lt;PrdCode&gt;prod.10086000001992&lt;/PrdCode&gt;
&lt;OptType&gt;0&lt;/OptType&gt;
&lt;Service&gt;
&lt;ServiceCode&gt;8585.memserv3&lt;/ServiceCode&gt;
&lt;/Service&gt;
&lt;/PrdList&gt;
&lt;/Member&gt;
&lt;/BODY&gt;
&lt;/NGMemberRequest&gt;</svcCont><transIDO xmlns="http://ECService.EC.webservice.whty.com/xsd">750201601141012400915</transIDO></request></ECServices></soap:Body></soap:Envelope>'''


class CmccOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # r2=r1='0000,1;成功'

            if r1 == '0':
                self.finish(SUCCESS)
                IOLoop.current().call_later(10, cmcc_callback, order_id)
            else:
                self.finish(FAIL)

        except Exception:
            request_log.exception('FAIL')


def cmcc_callback(order_id):
    body = EC05

    http_client = AsyncHTTPClient()

    try:
        request_log.info('MOPOTA CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/ECServicesForADCEndpoint', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
