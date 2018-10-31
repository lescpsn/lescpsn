import logging
from redis.sentinel import Sentinel
import time

import tornado.gen
import tornado.ioloop
from tornado.httpclient import HTTPError, HTTPClient
import yaml

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
            <OptType>2</OptType>
            <PayFlag>0</PayFlag>
            <UsecyCle>1</UsecyCle>
            <Mobile>{mobile}</Mobile>
            <UserName>{mobile}</UserName>
            <EffType>2</EffType>
            <PrdList>
                <PrdCode>{prd_code}</PrdCode>
                <OptType>4</OptType>
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


# @tornado.gen.coroutine
def call_cmcc(master, mobile, price, order_id, partner):
    """
    telecom -> up_order
    """
    prd_code = master.hget('private:cmcc:%s' % price, 'prd_code')
    service_code = master.hget('private:cmcc:%s' % price, 'service_code')

    up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", up_req_time)
    effect_type = 2

    body = REQUEST.format(
        tsp=tsp,
        mobile=mobile,
        order_id=order_id,
        prd_code=prd_code,
        service_code=service_code,
        ec_username=partner['ec_username'],
        ec_password=partner['ec_password'],
        ec_code=partner['ec_code'],
        prd_ordnum=partner['prd_ordnum'],
        effect_type=effect_type)

    url = partner['url.order']

    request_log.info('CALL_REQ %s', body, extra={'orderid': order_id})

    print(url)
    print(body)

    # call & wait
    response = None
    result = 9999

    http_client = HTTPClient()
    try:
        response = http_client.fetch(url, method='POST', headers=h, body=body, request_timeout=120)
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': order_id})
        result = 9999

    if response and response.code == 200:
        result = 200
        body = response.body.decode('utf8')
        # request_log.info('CALL_RESP %s', body, extra={'orderid': order_id})
        print(body)

    print(result)


def run(skip=0, stop=9999999):
    cfg = yaml.load(open('config.yaml', 'r'))

    sentinels = [(c['ip'], c['port']) for c in cfg['cache']]
    sentinel = Sentinel(sentinels, socket_timeout=0.1, db=1, decode_responses=True)

    master = sentinel.master_for('madeira')

    stream = open('clean.csv', 'r')

    n = 0
    for l in stream:

        if n < skip:
            print('SKIP %d' % n)
            n += 1
            continue

        if n >= stop:
            print('STOP AT %d' % n)
            break

        # Q2014120613471910003652,13413352219,10,cmcc
        order_id, mobile, price, routing = l.strip().split(',')
        print(order_id, mobile, price, routing)
        partner = cfg['upstream'][routing]
        order_id = 'T' + order_id[1:]

        call_cmcc(master, mobile, price, order_id, partner)
        n += 1


if __name__ == '__main__':
    run(skip=1, stop=100)
