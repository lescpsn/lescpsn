import logging
import xml.etree.ElementTree as ET
import time

import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESPONSE = r'''<soapenv:Body>
      <ns:ECServicesResponse xmlns:ns="http://ECService.EC.webservice.whty.com">
         <ns:return xsi:type="ax21:NGEC" xmlns:ax21="http://ECService.EC.webservice.whty.com/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <ax21:areacode>{areacode}</ax21:areacode>
            <ax21:bIPCode>EC0005</ax21:bIPCode>
            <ax21:bIPVer>V 1.0</ax21:bIPVer>
            <ax21:eCCode></ax21:eCCode>
            <ax21:eCUserName></ax21:eCUserName>
            <ax21:eCUserPwd></ax21:eCUserPwd>
            <ax21:origDomain>{origDomain}</ax21:origDomain>
            <ax21:processTime>20141031112547</ax21:processTime>
            <ax21:response>
               <ax21:rspCode>0000</ax21:rspCode>
               <ax21:rspDesc>成功</ax21:rspDesc>
            </ax21:response>
            <ax21:svcCont></ax21:svcCont>
            <ax21:transIDO>{transIDO}</ax21:transIDO>
         </ns:return>
      </ns:ECServicesResponse>
   </soapenv:Body>
</soapenv:Envelope>'''


class CallbackCmccHandler(CoreHandler):
    def get(self):

        if self.request.query == 'wsdl':
            f = open('handlers/data/ECServicesForADC.xml', 'r')
            wsdl = f.read()
            self.finish(wsdl.format(url=self.request.host))
        else:
            self.finish()

    @tornado.gen.coroutine
    def post(self):

        request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})

        body = self.request.body.decode('utf8')
        root = ET.fromstring(body)

        areacode = root.findall('.//{http://ECService.EC.webservice.whty.com/xsd}areacode')
        areacode = (areacode and areacode[0].text) or ''

        origDomain = root.findall('.//{http://ECService.EC.webservice.whty.com/xsd}origDomain')
        origDomain = (origDomain and origDomain[0].text) or ''

        transIDO = root.findall('.//{http://ECService.EC.webservice.whty.com/xsd}transIDO')
        transIDO = (transIDO and transIDO[0].text) or ''

        # Content-Type: text/xml;charset=UTF-8
        self.set_header('Content-Type', 'text/xml;charset=UTF-8')

        if self.request.path.find('11Endpoint') > 0:
            self.write('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">')
        else:
            self.write('<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">')

        resp_body = RESPONSE.format(origDomain=origDomain, transIDO=transIDO, areacode=areacode)

        request_log.info(resp_body, extra={'orderid': 'UNKNOWN'})

        self.finish(resp_body)

        try:
            svcCont = root.findall('.//{http://ECService.EC.webservice.whty.com/xsd}svcCont')
            svcCont = svcCont[0].text

            root = ET.fromstring(svcCont)
            sp_order_id = root.findall('.//BODY/Member/CRMApplyCode')
            sp_order_id = sp_order_id[0].text

            self.up_back_result = '1'
            master = self.master

            order_id = master.get('map:cmcc:%s' % sp_order_id)
            if order_id is None:
                raise RuntimeError('order_id is None')

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

            master.expire('map:cmcc:%s' % sp_order_id, 3600)

        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
