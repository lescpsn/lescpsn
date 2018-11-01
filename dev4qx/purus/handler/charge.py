# -*- coding: utf8 -*-
import base64
import re
import json
import time

from Crypto.Cipher import AES
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import JsonHandler
from secret import padding
from utils.escape import escape_data_result, escape_area, escape_carrier


class ChargeHandler(JsonHandler):
    def get_product(self):
        p = re.compile('1\d{6}')
        mobile = self.get_argument('m', None)

        user_id = self.current_user['partner_id']

        if mobile is None or not p.match(mobile):
            return self.finish(json.dumps({'status': 'fail'}))

        head = int(mobile[0:7])
        o, a = self.application.classifier.search(head)

        name = '%s%s' % (escape_area(a), escape_carrier(str(o)))

        slave = self.slave

        if 'master' in self.application.config['downstream'][user_id]:
            master_id = self.application.config['downstream'][user_id]['master']
        else:
            master_id = user_id

        plist = []
        prods = slave.keys('product:{master_id}:data:{carrier}:{area}:*'.format(master_id=master_id, carrier=o, area=a))

        if len(prods) == 0:
            a = 'CN'
            prods = slave.keys('product:{master_id}:data:{carrier}:CN:*'.format(master_id=master_id, carrier=o))

        for k in prods:
            prod = self.slave.hmget(k, ['carrier', 'value', 'name', 'discount', 'scope'])
            value = float(prod[1]) * int(prod[3]) / 10000
            scope = prod[4] or '0'
            offer = '%s:%s:%s' % (prod[0], a, prod[1])
            if scope != '0':
                offer = offer + ':' + scope

            plist.append({
                'offer': offer,
                'name': '%s' % prod[2],
                'value': '%0.3f' % value,
                'face': int(prod[1]),
                'scope': scope,
            })

        plist = sorted(plist, key=lambda p: '%s %05d' % (p['scope'], p['face']))

        self.finish(json.dumps({'status': 'ok',
                                'name': name,
                                'prod': plist}, indent=4))

    def get_page(self):
        self.render('charge_single.html', title=self.application.title)

    @tornado.web.authenticated
    def get(self, path_args):
        if path_args == '/product':
            self.get_product()
        else:
            self.get_page()

    def order_id(self):
        uid = self.master.incr('uid', 3)
        t = time.strftime("%Y%m%d%H%M%S", time.localtime())
        return 'P%s%08d' % (t, uid)

    @tornado.web.authenticated
    @gen.coroutine
    def post(self, path_args):
        user_id = self.current_user['partner_id']
        prod = self.json_args['prod']
        number = self.json_args['number']

        downstream = self.application.config['downstream'][user_id]

        if 'master' in downstream:
            master_id = downstream['master']
        else:
            master_id = user_id

        key = 'product:{master_id}:data:{prod}'.format(master_id=master_id, prod=prod)

        product = self.master.hmget(key, ['offer', 'value'])
        if product[0] is None:
            self.write_error(405)
            return

        order_id = self.order_id()

        code = json.dumps({
            'request_no': order_id,
            'contract_id': '100001',
            'order_id': order_id,
            'plat_offer_id': product[0],
            'phone_id': number,
            'facevalue': int(product[1]),
        })

        iv = downstream['iv']
        passphrase = downstream['pass']
        aes = AES.new(passphrase, AES.MODE_CBC, iv)

        b = aes.encrypt(padding(code))
        encrypted = base64.b64encode(b).decode('utf8')

        body = json.dumps({'partner_no': user_id, 'code': encrypted})

        url = 'http://{shard}/data/order'.format(shard=downstream['shard'])

        http_client = AsyncHTTPClient()
        try:
            request = HTTPRequest(url=url, method='POST', body=body)
            response = yield http_client.fetch(request)

            if response.code == 200:
                resp = json.loads(response.body.decode('utf8'))

                result = resp['result_code']
                request_no = resp.get('request_no')
                if result == '00000':
                    msg = {'status': 'ok', 'msg': '充值请求发送成功', 'sp_order_id': request_no}

                    self.master.hmset('latest:%s' % user_id, {'prod': prod, 'number': number})
                else:
                    msg = {'status': 'fail',
                           'msg': '充值请求发送失败，错误原因：{info}({result})'.format(
                               info=escape_data_result(result),
                               result=result),
                           'sp_order_id': request_no}

        except Exception as e:
            print(e)
            msg = {'status': 'fail'}
        finally:
            http_client.close()

        self.write(json.dumps(msg))

