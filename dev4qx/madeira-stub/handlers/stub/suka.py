import logging
import time
import xml.etree.ElementTree as ET
import hashlib

import tornado
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        # if type(p) is str:
        m.update(p.encode('utf8'))
        # else:
        # m.update(p)
    return m.hexdigest().upper()


class SukaOrderHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(SukaOrderHandler, self).__init__(application, request)

        self.req_time = time.localtime()
        self.mobile = None
        self.user_id = None
        self.price = None
        self.sp_order_id = None
        self.back_url = None

    def finish_with_success(self, result):
        order = ET.Element('order')
        ET.SubElement(order, 'resultno').text = result
        ET.SubElement(order, 'orderid').text = self.order_id
        ET.SubElement(order, 'ordercash').text = str(self.price * 0.985)
        ET.SubElement(order, 'sporderid').text = self.sp_order_id
        ET.SubElement(order, 'mobile').text = self.mobile
        ET.SubElement(order, 'merchantsubmittime').text = time.strftime("%Y%m%d%H%M%S", self.req_time)

        self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
        body = ET.tostring(order, encoding='gbk')
        self.finish(body)
        print('RESPONSE - %s' % body)

    def finish_with_err(self, code):
        order = ET.Element('order')
        ET.SubElement(order, 'orderid').text = self.order_id
        ET.SubElement(order, 'sporderid').text = self.sp_order_id
        ET.SubElement(order, 'resultno').text = str(code)

        self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
        body = ET.tostring(order, encoding='gbk')
        self.finish(body)
        print('RESPONSE - %s' % body)

    @tornado.gen.coroutine
    def post(self):
        print('REQUEST - %s' % self.request.body)

        try:
            self.mobile = self.get_body_argument('mobile')
            self.user_id = self.get_body_argument('userid')
            self.price = float(self.get_body_argument('price'))
            self.sp_order_id = self.get_body_argument('sporderid')
            self.back_url = self.get_body_argument('back_url')
        except:
            pass

        slave1 = self.application.sentinel.slave_for('madeira', db=1)
        master3 = self.application.sentinel.master_for('madeira', db=3)

        stub_order_id = slave1.hget('order:' + self.sp_order_id, 'sp_order_id')

        key = 'order:%s' % stub_order_id
        r1 = master3.hget(key, 'r1') or '0'
        r2 = master3.hget(key, 'r2') or '1'

        # order id
        xid = master3.incr('uid:xid')
        tsp = time.strftime("%Y%m%d%H%M%S", self.req_time)
        self.order_id = 'QX%s%08d' % (tsp, int(xid))

        # how to return
        if r1 == '0':
            IOLoop.current().call_later(10, test_callback, self.user_id, self.order_id, self.sp_order_id,
                                        r2,
                                        self.back_url)
            self.finish_with_success('0')
        else:
            self.finish_with_err(r1)


def test_callback(user_id, order_id, sp_order_id, result_no, back_url):
    finish_time = time.strftime("%Y%m%d%H%M%S", time.localtime())

    body = 'userid=%s&orderid=%s&sporderid=%s&merchantsubmittime=%s&resultno=%s' % (
        user_id,
        order_id,
        sp_order_id,
        finish_time,
        result_no)

    sign = signature(body + '&key=ejgljuuu8737454289202djfhshduskdlgdi23u32jjdfk')
    body += "&sign=" + sign
    print('CALLBACK - %s' % body)

    http_client = AsyncHTTPClient()
    try:
        http_client.fetch(back_url, method='POST', body=body)
    except Exception as e:
        print(e)
    finally:
        http_client.close()
