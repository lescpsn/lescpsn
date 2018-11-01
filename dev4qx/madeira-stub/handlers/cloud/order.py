import base64
import hashlib
import logging
import time
from urllib.parse import quote

from Crypto.Cipher import DES3
import tornado
from tornado.httpclient import AsyncHTTPClient
import tornado.web
from tornado import gen
from tornado.ioloop import IOLoop


key = 'bpOfdETMnMSSrsUkQKgXy5AyFOrB65ML'

request_log = logging.getLogger("madeira.request")

ORDER_TEMPLATE = r'''<?xml version="1.0" encoding="utf8"?>
<svr_STK_do_postOrder>
 <bill_id>{bill_id}</bill_id>
 <error_code>{error_code}</error_code>
 <error_detail>成功</error_detail>
</svr_STK_do_postOrder>'''


def unpad(s):
    return s[0:-ord(s[-1])]


def signature(part):
    m = hashlib.md5()
    m.update(part.encode('utf8'))
    return m.hexdigest()


def des3_decrypt(text, key):
    key = base64.b64decode(key)

    cipher = DES3.new(key, DES3.MODE_ECB)

    encrypted = base64.b64decode(text)
    plaintext = cipher.decrypt(encrypted)
    return unpad(plaintext.decode())


class CloudOrderHandler(tornado.web.RequestHandler):
    def post(self, *args, **kwargs):
        master1 = self.application.sentinel.master_for('madeira', db=1)
        master3 = self.application.sentinel.master_for('madeira', db=3)

        order = {}

        bill_req = self.get_body_argument('bill_req')
        bill_req = des3_decrypt(bill_req, key)

        for kv in bill_req.split('&'):
            k, v = kv.split('=')
            order[k] = v

        client_bill_id = self.get_body_argument('client_bill_id')
        # bill_usr_id = self.get_body_argument('bill_usr_id')
        # bill_amount = self.get_body_argument('bill_amount')

        stub_order_id = master1.hget('order:' + client_bill_id, 'sp_order_id')

        if stub_order_id is None:
            stub_order_id = client_bill_id

        request_log.info('ORDER %s -> %s', client_bill_id, stub_order_id)

        bill_id = int(master3.incr('id:cloud'))

        result = master3.hget('order:' + stub_order_id, 'spc_result')
        if result is None:
            result = '0'

        request_log.info('SPC %s', result)

        bill_id = 'B121207%06d' % bill_id

        self.finish(ORDER_TEMPLATE.format(bill_id=bill_id, error_code=result))

        if result == '0':
            charge_state = master3.hget('order:' + stub_order_id, 'spc_back_result')
            if charge_state is None:
                charge_state = '0'

            back_url = master3.hget('order:%s' % client_bill_id, 'back_url')
            if back_url is None:
                back_url = 'http://localhost:8901/callback/spc.do'

            order['bill_id'] = bill_id
            order['client_bill_id'] = client_bill_id
            order['charge_state'] = charge_state

            IOLoop.current().call_later(20, test_callback, order, back_url)


@tornado.gen.coroutine
def test_callback(order, back_url):
    bill_time = time.strftime('%Y-%m-%d %H:%M:%S')
    charge_note = '实际缴费100元'
    charge_time_consuming = '42'
    settle_amount = '0.03'

    q = ('client_bill_id={client_bill_id}'
         '&bill_id={bill_id}'
         '&bill_time={bill_time}'
         '&bill_crdno={bill_crd_no}'
         '&bill_usrid={bill_usr_id}'
         '&bill_amount={bill_amount}'
         '&charge_state={charge_state}'
         '&charge_note={charge_note}'
         '&charge_time={charge_time}'
         '&charge_time_consuming={charge_time_consuming}'
         '&settleup_amount={settle_amount}').format(
        client_bill_id=order['client_bill_id'],
        bill_id=order['bill_id'],
        bill_time=quote(bill_time),
        bill_crd_no='',
        bill_usr_id=order['bill_usrid'],
        bill_amount=order['bill_amount'],
        charge_state=order['charge_state'],
        charge_note=quote(charge_note),
        charge_time=quote(bill_time),
        charge_time_consuming=charge_time_consuming,
        settle_amount=settle_amount)

    sign = signature(q + '|||' + key)

    body = q + '&charge_count=1&sign=' + sign

    print('CALLBACK %s - %s' % (back_url, body))

    for i in range(1):
        http_client = AsyncHTTPClient()
        try:
            response = yield http_client.fetch(back_url, method='POST', body=body)

            if response and response.code == 200:
                break

            yield gen.Task(IOLoop.instance().add_timeout, time.time() + 5 * (i + 1))

        except Exception as e:
            print(e)
        finally:
            http_client.close()
