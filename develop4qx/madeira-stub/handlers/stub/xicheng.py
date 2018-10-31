import base64
import hashlib
import logging
import tornado
import tornado.web
import xml.etree.ElementTree as et
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

request_log = logging.getLogger("madeira.request")


# madeira的上游，只用取到order_id即可
class XichengOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:
            body = self.request.body.decode()
            root = et.fromstring(body)
            up_order_id = root.find('./head/orderId').text
            order_id = 'Q20' + up_order_id

            master_test = self.application.sentinel.master_for('madeira', db=3)

            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='0000,0090;电信通道故障！'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="0000" r2="0090;电信通道故障！"

            self.finish('<response><result>%s</result><desc></desc></response>' % r1)  # 返回下游报文

            if int(r1) == 0:
                IOLoop.current().call_later(1, xicheng_callback, up_order_id, r2)
        except Exception:
            request_log.exception('FAIL')


BODY = (
    '<request>'
    ' <head>'
    '  <custInteId>njqxwlkj</custInteId>'
    '  <echo>2016011422063442</echo>'
    '  <timestamp>20160114220634</timestamp>'
    '  <chargeSign>{sign}</chargeSign>'
    ' </head>'
    ' <body>'
    '  <item>'
    '   <orderId>{order_id}</orderId><orderType>1</orderType>'
    '   <packCode>100500</packCode><mobile>15302606785</mobile>'
    '   <result>{result}</result><desc>{desc}</desc>'
    '  </item>'
    ' </body>'
    '</request>')


def signature64(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode())
    return base64.b64encode(m.digest()).decode()


def xicheng_callback(order_id, result):
    desc = ''
    if ';' in result:
        result, desc = result.split(';')

    # cust_id + echo + secret + tsp
    sign = signature64('njqxwlkj' + '2016011422063442' + 'njqxwl@QX' + '20160114220634')
    body = BODY.format(sign=sign, order_id=order_id, result=result, desc=desc)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('XICHENG CALLBACK\n%s', body)

        h = {'Content-Type': 'application/xml;charset=UTF-8'}
        http_client.fetch('http://localhost:8899/callback/xicheng', headers=h, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
