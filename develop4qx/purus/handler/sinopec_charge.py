# -*- coding: utf8 -*-
from datetime import datetime
import json
import logging
import time
import xml.etree.ElementTree as ET

from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import JsonHandler
from utils.encryption_decryption import to_md5
from utils.escape import escape_area, escape_fee_result
import re


request_log = logging.getLogger("purus.request")

def sinopec_get_card_area(card_num):
    province_map = {
        '11':'北京',
        '12':'天津',
        '13':'河北',
        '14':'山西',
        '15':'内蒙古',
        '21':'辽宁',
        '22':'吉林',
        '23':'黑龙江',
        '31':'上海',
        '32':'江苏',
        '33':'浙江',
        '34':'安徽',
        '35':'福建',
        '36':'江西',
        '37':'山东',
        '41':'河南',
        '42':'湖北',
        '43':'湖南',
        '44':'广东',
        '45':'广西',
        '46':'海南',
        '50':'重庆',
        '51':'四川',
        '52':'贵州',
        '53':'云南',
        '54':'西藏',
        '61':'陕西',
        '62':'甘肃',
        '63':'青海',
        '64':'宁夏',
        '65':'新疆',
        '90':'深圳',
        '91':'北京龙禹',
    }

    province_key = card_num[6:8]
    if province_key == '86':
        province_key = card_num[8:10]

    return province_map.get(province_key)


class SinopecChargeHandler(JsonHandler):
    def get_product(self):
        account_number = self.get_argument('account_number', None)

        user_id = self.current_user['partner_id']

        area = sinopec_get_card_area(account_number)
        if account_number is None or not area:
            return self.finish(json.dumps({'status': 'fail'}))

        name = '中石化%s' % (escape_area(area))

        slave = self.slave

        if 'master' in self.application.config['downstream'][user_id]:
            master_id = self.application.config['downstream'][user_id]['master']
        else:
            master_id = user_id

        plist = []
        prods = slave.keys('product:{master_id}:sinopec:{carrier}:{area}:*'.format(master_id=master_id, carrier='sinopec', area='CN'))

        a = 'CN'
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
        self.render('sinopec_charge_single.html', title=self.application.title)

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

        key = 'product:{master_id}:sinopec:{prod}'.format(master_id=master_id, prod=prod)

        product = self.master.hget(key, 'value')
        if product[0] is None:
            self.write_error(405)
            return

        if not re.match(r'\d{19}', number):
            self.write_error(405)
            return

        try:
            order_id = self.order_id()
            ORDER_FORMAT = 'product=sinopec&userid={userid}&price={price}&num=1&account_number={account_number}&spordertime={spordertime}&sporderid={sporderid}'
            back_url = self.application.config['connection']['fuel_card_callback']
            order = ORDER_FORMAT.format(userid=user_id,
                                price=product,
                                account_number= number,
                                spordertime=datetime.now().strftime("%Y%m%d%H%M%S"),
                                sporderid=order_id
                                )

            sign = order + "&key=" + downstream['key']
            requ_body = order + "&sign="+to_md5(sign) + "&back_url=" + back_url

            url = 'http://{shard}/order.do'.format(shard=downstream['shard'])

            http_client = AsyncHTTPClient()
            request = HTTPRequest(url=url, method='POST', body=requ_body)
            response = yield http_client.fetch(request)

            if response.code == 200:
                resp = response.body.decode('utf8')
                print(resp)
                root = ET.fromstring(resp)
                result = root.find('resultno').text
                request_no = root.find('sporderid').text

                if result == '0':
                    order_id = root.find('orderid').text
                    msg = {'status': 'ok', 'msg': '充值请求发送成功', 'sp_order_id': request_no, 'order_id': order_id}

                    self.master.hmset('latest:%s' % user_id, {'prod': prod, 'number': number})
                else:
                    msg = {'status': 'fail',
                           'msg': '充值请求发送失败，错误原因：{info}({result})'.format(
                               info=escape_fee_result(result),
                               result=result),
                           'sporderid': request_no}

        except Exception as e:
            request_log.error("SINOPEC CHARGE EXCEPTION {0}".format(e))
            request_log.exception("SINOPEC CHARGE EXCEPTION")

            msg = {'status': 'fail'}


        self.write(json.dumps(msg))

