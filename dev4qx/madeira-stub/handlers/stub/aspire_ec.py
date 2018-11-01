import base64
import codecs
import json
import logging
import re
import time

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from Crypto.Cipher import AES
import xml.etree.ElementTree as ET

request_log = logging.getLogger("madeira.request")

RESPONSE = ('<?xmlversion="1.0"encoding="UTF-8"?>'
            '<InterBOSS>'
            '<Version>0100</Version>'
            '<TestFlag>0</TestFlag>'
            '<BIPType>'
            '<BIPCode>BIP4B876</BIPCode><ActivityCode>T4011137</ActivityCode><ActionCode>1</ActionCode>'
            '</BIPType>'
            '<RoutingInfo>'
            '<OrigDomain>STKP</OrigDomain>'
            '<RouteType>00</RouteType>'
            '<Routing><HomeDomain>BBSS</HomeDomain><RouteValue>998</RouteValue></Routing>'
            '</RoutingInfo>'
            '<TransInfo>'
            '<SessionID>DXHLQ2016011608432714348643</SessionID>'
            '<TransIDO>DXHLQ2016011608432714348643</TransIDO>'
            '<TransIDOTime>20160116084327</TransIDOTime>'
            '<TransIDH>BBOSSRSP20160116084327</TransIDH>'
            '<TransIDHTime>20160116084327</TransIDHTime>'
            '</TransInfo>'
            '<Response><RspType>0</RspType><RspCode>0000</RspCode><RspDesc>Success</RspDesc></Response>'
            '<SvcCont><![CDATA['
            '<?xmlversion="1.0"encoding="UTF-8"?>'
            '<AdditionRsp><Status>00</Status><OperSeqList><OperSeq>{OperSeq}</OperSeq></OperSeqList><ErrDesc></ErrDesc></AdditionRsp>'
            ']]></SvcCont></InterBOSS>')

RESPONSE_FAIL = (
                '<?xmlversion="1.0"encoding="UTF-8"?>'
                '<InterBOSS>'
                '<Version>0100</Version>'
                '<TestFlag>0</TestFlag>'
                '<BIPType>'
                '<BIPCode>BIP4B876</BIPCode>'
                '<ActivityCode>T4011137</ActivityCode>'
                '<ActionCode>1</ActionCode>'
                '</BIPType>'
                '<RoutingInfo>'
                '<OrigDomain>STKP</OrigDomain>'
                '<RouteType>00</RouteType>'
                '<Routing>'
                '<HomeDomain>BBSS</HomeDomain>'
                '<RouteValue>998</RouteValue>'
                '</Routing>'
                '</RoutingInfo>'
                '<TransInfo>'
                '<SessionID>DXHLQ2015123122412413967689</SessionID>'
                '<TransIDO>DXHLQ2015123122412413967689</TransIDO>'
                '<TransIDOTime>20151231224124</TransIDOTime>'
                '<TransIDH>TRNH20151231224124000001948277</TransIDH>'
                '<TransIDHTime>20151231224124</TransIDHTime>'
                '</TransInfo>'
                '<Response>'
                '<RspType>1</RspType>'
                '<RspCode>3301</RspCode>'
                '<RspDesc>Islessthan48hoursfromtheendofthemonth</RspDesc>'
                '</Response>'
                '</InterBOSS>'
)


CALLBACK = (
    '--_MAPpuPUxkn6sto_UCwkqPXdst7VlxLgBaeA'
    'Content-Disposition:form-data;name="xmlhead"'
    'Content-Type:application/xml;charset=UTF-8'
    'Content-Transfer-Encoding:8bit'
    '<?xmlversion="1.0"encoding="UTF-8"?>'
    '<InterBOSS>'
    '<Version>0100</Version><TestFlag>1</TestFlag><BIPType><BIPCode>BIP4B877</BIPCode>'
    '<ActivityCode>T4011138</ActivityCode><ActionCode>0</ActionCode></BIPType>'
    '<RoutingInfo><OrigDomain>BBSS</OrigDomain><RouteType>00</RouteType>'
    '<Routing><HomeDomain>STKP</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo>'
    '<TransInfo><SessionID>PROC20160101173825000026639464</SessionID>'
    '<TransIDO>{0}</TransIDO><TransIDOTime>20160101173834</TransIDOTime></TransInfo>'
    '</InterBOSS>'
    '--_MAPpuPUxkn6sto_UCwkqPXdst7VlxLgBaeA'
    'Content-Disposition:form-data;name="xmlbody"'
    'Content-Type:application/xml;charset=UTF-8'
    'Content-Transfer-Encoding:8bit'
    '<?xmlversion="1.0"encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA['
    '<?xmlversion="1.0"encoding="UTF-8"standalone="yes"?>'
    '<AdditionResult><OperSeq>{OperSeq}</OperSeq><SuccNum>0</SuccNum><FailNum>1</FailNum><FailInfo>'
    '<MobNum>{1}</MobNum><Rsp>0305</Rsp>'
    '<RspDesc>05:CGrpTaskChildProc:::resp.retcode[0]errinfo4:错误:用户为停机状态,不能办理增加或修改增值产品的业务!</RspDesc>'
    '</FailInfo></AdditionResult>]]></SvcCont></InterBOSS>'
    '--_MAPpuPUxkn6sto_UCwkqPXdst7VlxLgBaeA--')

CALLBACK_SUCC = (
    '--_MAPpuPUxkn6sto_UCwkqPXdst7VlxLgBaeA'
    'Content-Disposition:form-data;name="xmlhead"'
    'Content-Type:application/xml;charset=UTF-8'
    'Content-Transfer-Encoding:8bit'
    '<?xmlversion="1.0"encoding="UTF-8"?>'
    '<InterBOSS>'
    '<Version>0100</Version><TestFlag>1</TestFlag><BIPType><BIPCode>BIP4B877</BIPCode>'
    '<ActivityCode>T4011138</ActivityCode><ActionCode>0</ActionCode></BIPType>'
    '<RoutingInfo><OrigDomain>BBSS</OrigDomain><RouteType>00</RouteType>'
    '<Routing><HomeDomain>STKP</HomeDomain><RouteValue>998</RouteValue></Routing></RoutingInfo>'
    '<TransInfo><SessionID>PROC20160101173825000026639464</SessionID>'
    '<TransIDO>20160101173834</TransIDO><TransIDOTime>20160101173834</TransIDOTime></TransInfo>'
    '</InterBOSS>'
    '--_MAPpuPUxkn6sto_UCwkqPXdst7VlxLgBaeA'
    'Content-Disposition:form-data;name="xmlbody"'
    'Content-Type:application/xml;charset=UTF-8'
    'Content-Transfer-Encoding:8bit'
    '<?xmlversion="1.0"encoding="UTF-8"?><InterBOSS><SvcCont><![CDATA['
    '<?xmlversion="1.0"encoding="UTF-8"standalone="yes"?>'
    '<AdditionResult>'
    '<OperSeq>{OperSeq}</OperSeq>'
    '<SuccNum>{SuccNum}</SuccNum>'
    '{SuccessTelList}'
    '<FailNum>{FailNum}</FailNum>'
    '{FailTelList}'
    '</AdditionResult>'
    ']]></SvcCont></InterBOSS>'
    '--_MAPpuPUxkn6sto_UCwkqPXdst7VlxLgBaeA--')

SUCCESS_TEL =  '<SuccInfo><SuccTel>{Mobile}</SuccTel></SuccInfo>'
FAIL_TEL =  '<FailInfo><MobNum>{Mobile}</MobNum><Rsp>02</Rsp><RspDesc>订购关系不存在</RspDesc></FailInfo>'


def search_value(pattern, s):
    m = re.search(pattern, s)
    if m:
        return m.group(1)

    return ''


class AspireECOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):

        # self.finish(RESPONSE_FAIL)

        request_body = self.request.body
        print("request_body:",request_body)
        request_info = request_body.decode()
        request_info = ''.join(request_info.split())

        OperSeq = str(int(time.time()))

        mobile_list = ()
        mobile_list = re.findall(r'<MobNum>(\d+)</MobNum>', request_info)

        self.finish(RESPONSE.format(OperSeq=OperSeq))
        IOLoop.current().call_later(2, aspire_ec_callback, OperSeq, mobile_list)
        # try:
        #     master_target = self.application.sentinel.master_for('madeira', db=1)
        #     master_test = self.application.sentinel.master_for('madeira', db=3)
        #
        #     all_orders = master_target.smembers('list:create')
        #     print("all_orders:",all_orders)
        #     order_id = sorted(all_orders, reverse=True)[0]  # work-around: get last order
        #     print("order_id:",order_id)
        #     r2 = r1 = master_test.hget('result:' + order_id, 'result')  # r2=r1='0000,1;成功'
        #     if ',' in r1:
        #         r1, r2 = r1.split(',')
        #
        #     if r1 == '00':
        #         self.finish(RESPONSE)
        #         IOLoop.current().call_later(10, aspire_ec_callback, order_id, r2)
        #     else:
        #         self.finish(RESPONSE)
        #
        # except Exception:
        #     request_log.exception('FAIL')


def aspire_ec_callback(OperSeq, mobile_list):
    #body = CALLBACK.format(TransIDO, MobNum)

    SuccNum = 0
    SuccessTelList = ''
    FailNum = 0
    FailTelList = ''
    # for mobile in mobile_list:
    #     SuccessTelList += SUCCESS_TEL.format(Mobile = mobile)

    for index, mobile in enumerate(mobile_list):
        if index % 2 == 0:
            SuccNum += 1
            SuccessTelList += SUCCESS_TEL.format(Mobile = mobile)
        else:
            FailNum += 1
            FailTelList += FAIL_TEL.format(Mobile = mobile)

    body = CALLBACK_SUCC.format(OperSeq=OperSeq, SuccNum=SuccNum, SuccessTelList=SuccessTelList,FailNum=FailNum,FailTelList=FailTelList)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('ASPIRE_EC CALLBACK\n%s', body)

        http_client.fetch('http://192.168.1.152:8899/callback/cmcc3.do', method='POST', body=body,
                          headers={'Content-Type': 'application/xml;charset=UTF-8'})
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
