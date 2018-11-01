import logging

import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")

FAIL = r'''<?xml version='1.0' encoding='UTF-8'?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
<soapenv:Body>
<ns2:odrerFlowResponse xmlns:ns2="http://zz.protocol.intf.tisson.cn">
<sessionId>1244</sessionId>
<resultCode>0</resultCode>
<resultDesc>ok</resultDesc>
</ns2:odrerFlowResponse>
</soapenv:Body>
</soapenv:Envelope>'''

r'''<?xml version='1.0' encoding='UTF-8'?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
<soapenv:Body>
<ns2:odrerFlowResponse xmlns:ns2="http://zz.protocol.intf.tisson.cn">
<sessionId>0</sessionId>
<resultCode>1009</resultCode>
<resultDesc>流量包额度不够！</resultDesc>
</ns2:odrerFlowResponse>
</soapenv:Body>
</soapenv:Envelope>'''

SUCCESS = r'''<?xml version='1.0' encoding='UTF-8'?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
<soapenv:Body>
<ns2:odrerFlowResponse xmlns:ns2="http://zz.protocol.intf.tisson.cn">
<sessionId>1244</sessionId>
<resultCode>0</resultCode>
<resultDesc>ok</resultDesc>
</ns2:odrerFlowResponse>
</soapenv:Body>
</soapenv:Envelope>'''


class TelecomGuangzhouHandler(tornado.web.RequestHandler):
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
                IOLoop.current().call_later(10, telecom_gz_callback, order_id)
            else:
                self.finish(FAIL)

        except Exception:
            request_log.exception('FAIL')


def telecom_gz_callback(order_id):
    body = 'sessionId=1023&userPhone=13326701516&productCode=100012329&orderStat=0'

    http_client = AsyncHTTPClient()

    try:
        request_log.info('MOPOTA CALLBACK\n%s', body)

        http_client.fetch('http://localhost:8899/callback/telecom_gz', method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
