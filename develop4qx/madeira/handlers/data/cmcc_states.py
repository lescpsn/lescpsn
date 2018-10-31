import logging
import time
import xml.etree.ElementTree as ET

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError


h = {'SOAPAction': 'http://adc.ecinterface/NGADCServiceForEC/AdcECInterface',
     'Content-Type': 'text/xml; charset=utf-8'}

request_log = logging.getLogger("madeira.request")

REQUEST = r'''<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header/>
   <soapenv:Body>
      <AdcECInterface xmlns="http://adc.ecinterface/">
         <requestBody>
            <OrigDomain>GDFP</OrigDomain>
            <BIPCode>{func}</BIPCode>
            <BIPVer>0100</BIPVer>
            <TransIDO>{trans_id}</TransIDO>
            <ECCode>{ec_code}</ECCode>
            <AreaCode>998</AreaCode>
            <ECUserPwd>{ec_password}</ECUserPwd>
            <ECUserName>{ec_username}</ECUserName>
            <ProcessTime>{tsp}</ProcessTime>
            <SvcCont><![CDATA[{content}]]></SvcCont>
         </requestBody>
      </AdcECInterface>
   </soapenv:Body>
</soapenv:Envelope>'''

CONTENT_E04 = ('<UserInfo><ProductID>{product_id}</ProductID>'
               '<UserData><MobNum>{mobile}</MobNum><OprCode>01</OprCode>'
               '<UserPackage>{package}</UserPackage><ValidMonths>1</ValidMonths></UserData>'
               '<EffRule>0</EffRule></UserInfo>')

CONTENT_E01 = ('<AdditionInfo><ProductID>{product_id}</ProductID>'
               '<UserData><MobNum>{mobile}</MobNum><UserPackage>{package}</UserPackage></UserData>'
               '</AdditionInfo>')


@tornado.gen.coroutine
def up_cmcc_states(handler, partner):
    """
    telecom -> up_order
    """
    product_id = partner['product_id']
    package = handler.slave.hget('private:cmcc:states:%d' % handler.price, 'package')

    handler.up_req_time = time.localtime()
    t = time.time() + 1800
    tsp = time.strftime("%Y%m%d%H%M%S", time.localtime(t))

    # check user
    status0 = tsp[0:6]
    status1 = handler.slave.get('cmcc:user:%s' % handler.mobile)

    # return fail when processing
    if status1 and status1 == 'processing':
        handler.up_resp_time = time.localtime()
        handler.up_result = '8000'
        return handler.up_result

    processing = False
    if status1 is None or status1 != status0:
        func = 'EC1004'  # new user
        content = CONTENT_E04.format(package=package, mobile=handler.mobile, product_id=product_id)
        handler.master.set('cmcc:user:%s' % handler.mobile, 'processing')  # set flag
        processing = True
    else:
        func = 'EC1001'  # exist user
        content = CONTENT_E01.format(package=package, mobile=handler.mobile, product_id=product_id)
        # temp
        #handler.up_resp_time = time.localtime()
        #handler.up_result = '8001'
        #return handler.up_result

    trans_id = tsp + handler.order_id[-5:]

    body = REQUEST.format(
        tsp=tsp,
        func=func,
        content=content,
        ec_username=partner['ec_username'],
        ec_password=partner['ec_password'],
        ec_code=partner['ec_code'],
        trans_id=trans_id)

    url = partner['url.order']

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    result = 99999

    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode('utf8')
        request_log.info('CALL_RESP %s', body.replace('\n', ''), extra={'orderid': handler.order_id})

        try:
            root = ET.fromstring(body)
            svc_cont = root.findall('.//{http://adc.ecinterface/}SvcCont')

            if svc_cont and svc_cont[0].text:
                cont = ET.fromstring(svc_cont[0].text)
                up_order_id = cont.findall('./OperSeqList/OperSeq')

                if up_order_id and up_order_id[0].text:
                    handler.up_order_id = up_order_id[0].text
                    handler.up_cost = handler.cost
                    result = 0

                    handler.master.set('map:cmcc:%s' % handler.up_order_id, handler.order_id)

                else:
                    result_code = cont.findall('./UserResponse/Status')

                    if result_code and result_code[0].text:
                        result = result_code[0].text
                    else:
                        result = 99999

                    if processing:
                        handler.master.delete('cmcc:user:%s' % handler.mobile)

            else:
                resp_code = root.findall('.//{http://adc.ecinterface/}RspCode')

                if resp_code and resp_code[0].text:
                    result = resp_code[0].text
                else:
                    result = 99999

                if processing:
                    handler.master.delete('cmcc:user:%s' % handler.mobile)


            handler.up_result = result
        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    if handler.up_result is None:
        handler.up_result = result

    return result
