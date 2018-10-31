import logging
import xml.etree.ElementTree as ET
import time

import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESPONSE = r'''<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
<soapenv:Body>
  <ns:ECServicesResponse xmlns:ns="http://ECService.EC.webservice.whty.com">
     <ns:return xsi:type="ax21:NGEC" xmlns:ax21="http://ECService.EC.webservice.whty.com/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <ax21:areacode>{areacode}</ax21:areacode>
        <ax21:bIPCode>EC1005</ax21:bIPCode>
        <ax21:bIPVer>V 1.0</ax21:bIPVer>
        <ax21:eCCode></ax21:eCCode>
        <ax21:eCUserName></ax21:eCUserName>
        <ax21:eCUserPwd></ax21:eCUserPwd>
        <ax21:origDomain>{origDomain}</ax21:origDomain>
        <ax21:processTime>20141031112547</ax21:processTime>
        <ax21:response>
          <ax21:rspCode>00</ax21:rspCode><ax21:rspDesc>成功</ax21:rspDesc>
        </ax21:response>
        <ax21:svcCont></ax21:svcCont>
        <ax21:transIDO>{transIDO}</ax21:transIDO>
     </ns:return>
  </ns:ECServicesResponse>
</soapenv:Body>
</soapenv:Envelope>'''


class CallbackCmccStatesHandler(CoreHandler):
    def get(self):

        if self.request.query == 'wsdl':
            f = open('handlers/data/ECServicesForADC.xml', 'r')
            wsdl = f.read()
            self.finish(wsdl.format(url=self.request.host))
        else:
            self.finish()

    @tornado.gen.coroutine
    def post(self):

        try:
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
            resp_body = RESPONSE.format(origDomain=origDomain, transIDO=transIDO, areacode=areacode)

            # request_log.info(resp_body, extra={'orderid': 'UNKNOWN'})
            self.finish(resp_body)

            svcCont = root.findall('.//{http://ECService.EC.webservice.whty.com/xsd}svcCont')
            svcCont = svcCont[0].text

            root = ET.fromstring(svcCont)
            sp_order_id = root.findall('.//OperSeq')
            sp_order_id = sp_order_id[0].text

            back_result = root.findall('.//SuccNum')
            back_result = back_result[0].text

            if back_result == '1':
                self.up_back_result = '1'
            else:
                self.up_back_result = '9'

            master = self.master
            order_id = master.get('map:cmcc:%s' % sp_order_id)
            if order_id is None:
                order_id = 'UNKNOWN'
                request_log.error('CALLBACK ERROR - %s' % body.replace('\n', ''), extra={'orderid': order_id})
                raise RuntimeError('order_id is None')

            request_log.info('CALLBACK %s - %s' % (self.request.uri, body.replace('\n', '')),
                             extra={'orderid': order_id})

            if not master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            stage = self.restore_order(order_id)

            processing = master.get('cmcc:user:%s' % self.mobile)
            if processing == 'processing':
                if self.up_back_result == '1':
                    master.set('cmcc:user:%s' % self.mobile, time.strftime("%Y%m", time.localtime()))
                else:
                    master.delete('cmcc:user:%s' % self.mobile)

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
