import logging
import time
import xml.etree.ElementTree as ET

import tornado
from tornado.httpclient import AsyncHTTPClient, HTTPError

RESULT_MAP = {
    '0': 0,  # 成功
    '983300': 9,  # 该用户对应的集团产品不存在
    '983301': 10074,  # 该用户没有加入该集群网
    '983302': 10058,  # 无法为该用户分配短号
    '981018': 9,  # 参数有效性校验
    '981004': 10111,  # 业务规则有效性校验(用户加入的为敏感集团)
    '983303': 10225,  # 不是成员可选套餐
    '983304': 10016,  # 该成员已存在
    '983305': 10074,  # 该成员不存在
    '983306': 10020,  # 话费余额不足
    '983308': 9,  # 并网中的短号集群网成员的短号不允许重复
    '983319': 9,  # 该成员正在通过二次确认流程等待处理中
    '983320': 9,  # 该成员本月转网或转套餐次数已超过限制
    '983307': 9,  # 该用户已经是其它集团用户[集团产品号码xxx]的在用成员
    '100': 9,  # 数据库错误，错误代码由sqlcode指定
    '200': 99999,  # 操作系统错误，错误代码由errno指定
    '300': 9,  # 交易中间件错误，错误代码由errcode指定
    '400': 9,  # 超时错误
    '500': 9,  # 数据报文错误
}

h = {'SOAPAction': 'http://adc.ecinterface/NGADCServiceForEC/AdcServices',
     'Content-Type': 'text/xml; charset=utf-8'}

request_log = logging.getLogger("madeira.request")

REQUEST = r'''<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header/>
   <soapenv:Body>
      <AdcServices xmlns="http://adc.ecinterface/">
         <request>
            <OrigDomain>NGEC</OrigDomain>
            <BIPCode>EC0001</BIPCode>
            <BIPVer>V1.0</BIPVer>
            <TransIDO>{order_id}</TransIDO>
            <Areacode>GD</Areacode>
            <ECCode>{ec_code}</ECCode>
            <ECUserName>{ec_username}</ECUserName>
            <ECUserPwd>{ec_password}</ECUserPwd>
            <ProcessTime>{tsp}</ProcessTime>
            <SvcCont><![CDATA[<MemberShipRequest>
      <BODY>
        <ECCode>{ec_code}</ECCode>
        <PrdOrdNum>{prd_ordnum}</PrdOrdNum>
        <Member>
          <OptType>{opt_type_a}</OptType>
          <PayFlag>0</PayFlag>
          <UsecyCle>1</UsecyCle>
          <Mobile>{mobile}</Mobile>
          <UserName>{mobile}</UserName>
          <EffType>{effect_type}</EffType>
          <PrdList>
            <PrdCode>AppendAttr.8585</PrdCode>
            <OptType>{opt_type_b}</OptType>
            <Service>
              <ServiceCode>Service8585.Mem</ServiceCode>
              <USERINFOMAP>
                <OptType>{opt_type_b}</OptType>
                <ItemName>IFPersonPay</ItemName>
                <ItemValue>0</ItemValue>
              </USERINFOMAP>
            </Service>
          </PrdList>
          <PrdList>
            <PrdCode>{prd_code}</PrdCode>
            <OptType>0</OptType>
            <Service>
                <ServiceCode>{service_code}</ServiceCode>
            </Service>
          </PrdList>
        </Member>
      </BODY>
    </MemberShipRequest>]]></SvcCont>
         </request>
      </AdcServices>
   </soapenv:Body>
</soapenv:Envelope>'''


@tornado.gen.coroutine
def up_cmcc(handler, partner):
    """
    telecom -> up_order
    """
    prd_code = handler.slave.hget('private:cmcc:%d' % handler.price, 'prd_code')
    service_code = handler.slave.hget('private:cmcc:%d' % handler.price, 'service_code')

    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)

    if handler.effect_type and handler.effect_type == '2':
        effect_type = 3
    else:
        effect_type = 2

    body = REQUEST.format(
        tsp=tsp,
        mobile=handler.mobile,
        order_id=handler.order_id,
        prd_code=prd_code,
        service_code=service_code,
        ec_username=partner['ec_username'],
        ec_password=partner['ec_password'],
        ec_code=partner['ec_code'],
        prd_ordnum=partner['prd_ordnum'],
        effect_type=effect_type,
        opt_type_a='0',
        opt_type_b='0')

    url = partner['url.order']

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    result = 99999
    up_result = None

    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
    # finally:
    # http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode('utf8')
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            root = ET.fromstring(body)
            svc_cont = root.findall('.//{http://adc.ecinterface/}SvcCont')

            if svc_cont and svc_cont[0].text:
                cont = ET.fromstring(svc_cont[0].text)
                up_order_id = cont.findall('./BODY/Member/CRMApplyCode')

                if up_order_id and up_order_id[0].text:
                    handler.up_order_id = up_order_id[0].text
                    handler.up_cost = handler.cost
                    result = 0

                    handler.master.set('map:cmcc:%s' % handler.up_order_id, handler.order_id)

                else:
                    result_code = cont.findall('./BODY/Member/ResultCode')

                    if result_code and result_code[0].text:
                        result = result_code[0].text

                    else:
                        result = 99999

            else:
                resp_code = root.findall('.//{http://adc.ecinterface/}RspCode')

                if resp_code and resp_code[0].text:
                    up_result = resp_code[0].text
                    if not up_result in ['940037', '940003']:
                        result = RESULT_MAP.get(up_result, 9)
                else:
                    result = 99999

            handler.up_result = up_result
        except Exception as e:
            result = 99999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    # Hot-Fix
    if up_result in ['940037', '940003']:
        body = REQUEST.format(
            tsp=tsp,
            mobile=handler.mobile,
            order_id=handler.order_id + 'B',
            prd_code=prd_code,
            service_code=service_code,
            ec_username=partner['ec_username'],
            ec_password=partner['ec_password'],
            ec_code=partner['ec_code'],
            prd_ordnum=partner['prd_ordnum'],
            effect_type=effect_type,
            opt_type_a='4',
            opt_type_b='2')


        # call & wait
        result = 99999
        http_client = AsyncHTTPClient()
        try:
            response = yield http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)
        except HTTPError as http_error:
            request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
            result = 60000 + http_error.code
        except Exception as e:
            request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})

        handler.up_resp_time = time.localtime()  # <--------------

        if response and response.code == 200:
            body = response.body.decode('utf8')
            request_log.info('CALL_RESP2 %s', body.replace('\n', ' '), extra={'orderid': handler.order_id})

            try:
                root = ET.fromstring(body)
                svc_cont = root.findall('.//{http://adc.ecinterface/}SvcCont')

                if svc_cont and svc_cont[0].text:
                    cont = ET.fromstring(svc_cont[0].text)
                    up_order_id = cont.findall('./BODY/Member/CRMApplyCode')

                    if up_order_id and up_order_id[0].text:
                        handler.up_order_id = up_order_id[0].text
                        handler.up_cost = handler.cost
                        result = 0

                        handler.master.set('map:cmcc:%s' % handler.up_order_id, handler.order_id)

                    else:
                        result_code = cont.findall('./BODY/Member/ResultCode')

                        if result_code and result_code[0].text:
                            result = result_code[0].text
                        else:
                            result = 99999

                else:
                    resp_code = root.findall('.//{http://adc.ecinterface/}RspCode')

                    if resp_code and resp_code[0].text:
                        up_result = resp_code[0].text
                        result = RESULT_MAP.get(up_result, 9)
                    else:
                        result = 99999

                handler.up_result = up_result
            except Exception as e:
                result = 99999
                request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    # Hot-Fix END..............
    if handler.up_result is None:
        handler.up_result = result

    return result
