import base64
import hashlib
import json
import logging
import time
import tornado.gen
import tornado.web
import xml.etree.ElementTree as et
from Crypto.Cipher import AES
from tornado.httpclient import AsyncHTTPClient, HTTPClient

request_log = logging.getLogger("madeira.request")

BLOCK_SIZE = 16


def pad(s):
    return s + (BLOCK_SIZE - len(s) % BLOCK_SIZE) * chr(BLOCK_SIZE - len(s) % BLOCK_SIZE)


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode('utf8'))
    return m.hexdigest().upper()


class UnitStartHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('order2.html')

    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        body = self.request.body.decode()

        args = json.loads(body)
        t = args['type']

        if t == 'fee':
            yield self.fee(args)
            return
        elif t == 'data':
            yield self.data(args)
            return

    @tornado.gen.coroutine
    def data(self, args):
        user_id = args['user_id']
        price = args['price']
        value = args['value']
        mobile = args['mobile']
        cost = args['cost']
        result = args['result']
        offer = args['offer']
        url = args['url']
        route = args['routing']
        scope = args['scope']

        master_test = self.application.sentinel.master_for('madeira', db=3)
        master_target = self.application.sentinel.master_for('madeira', db=1)

        config = self.application.config

        password = config['downstream'][user_id]['pass']
        iv = config['downstream'][user_id]['iv']

        tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())

        ###################################
        # set redis routing, pricing
        carrier, area = self.application.classifier.search(mobile)
        # if carrier == 3:
        #     scope = '1'
        # else:
        #     scope = "0"

        # price:100001:data:2:10
        if scope == '0':
            scope_txt = ''
        else:
            scope_txt = scope + ':'

        key1 = 'price:{user}:data:{carrier}:{scope}{price}'.format(
            user=user_id,
            scope=scope_txt,
            carrier=carrier,
            price=price)

        p = '%s,%s' % (value, offer)
        request_log.info('SET {key} {value}'.format(key=key1, value=p))
        master_target.set(key1, p)

        key2 = 'price:{user}:data:{carrier}:{area}:{scope}{price}'.format(
            user=user_id,
            carrier=carrier,
            scope=scope_txt,
            area=area,
            price=price)
        request_log.info('DEL {key}'.format(key=key2))
        master_target.delete(key2)

        # ROUTING
        key1 = 'route:{user_id}:data:{carrier}:CN:{scope}:{price}'.format(
            scope=scope,
            user_id=user_id,
            carrier=carrier,
            price=price)

        if route:
            v = []
            for r in route.split(';'):
                cond = ''
                if '@' in r:
                    r, t = r.split('@')
                    cond = '@time<' + t
                v.append('{route},{cost}{cond}'.format(route=r, cost=cost, cond=cond))
            v = ';'.join(v)

            request_log.info('SET %s %s', key1, v)
            master_target.set(key1, v)
        else:
            request_log.info('DEL %s', key1)
            master_target.delete(key1)

        key2 = 'route:{user_id}:data:{carrier}:{area}:{scope}:{price}'.format(
            user_id=user_id,
            carrier=carrier,
            area=area,
            scope=scope,
            price=price)

        request_log.info('DEL %s', key2)
        master_target.delete(key2)

        uid = int(master_test.incr('uid:order'))
        sp_order_id = 'STUB%s%08d' % (tsp, uid)

        '''
        Setting order
        '''
        code = json.dumps({
            'request_no': sp_order_id,
            'contract_id': '100001',
            'order_id': sp_order_id,
            'plat_offer_id': offer,
            'phone_id': mobile,
            'facevalue': price,
            'effect_type': '2',
        })

        request_log.info('CODE=' + code)

        # aes
        aes = AES.new(password, AES.MODE_CBC, iv)
        b = aes.encrypt(pad(code))
        encrypted = base64.b64encode(b).decode('utf8')

        body = json.dumps({'partner_no': user_id, 'code': encrypted})
        request_log.info('BODY=' + body)

        # call & wait
        resp = ''
        http_client = HTTPClient()
        try:
            response = http_client.fetch(url + '/data/order', method='POST', body=body)
            request_log.info(response.body.decode())
            resp = response.body.decode()
        except Exception as e:
            print(e)
        finally:
            http_client.close()

        self.finish(resp)

        for _ in range(10):
            order_id = master_target.get('map:%s:%s' % (user_id, sp_order_id))
            if order_id:
                request_log.info('PUSH RESULT {%s} TO %s', result, order_id)
                master_test.hset('result:' + order_id, 'result', result)
                break

            yield tornado.gen.sleep(1)

    @tornado.gen.coroutine
    def fee(self, args):
        user_id = args.get('user_id')
        price = args.get('price')
        value = args.get('value')
        mobile = args.get('mobile')
        cost = args.get('cost')
        result = args.get('result')
        url = args.get('url')
        route = args.get('routing')

        # set result
        master3 = self.application.sentinel.master_for('madeira', db=3)
        master1 = self.application.sentinel.master_for('madeira', db=1)

        # downstream order_id
        req_time = time.localtime()

        uid = int(master3.incr('uid:order'))
        tsp = time.strftime("%Y%m%d%H%M%S", req_time)
        order_id = 'STUB%s%08d' % (tsp, uid)

        # set redis routing, pricing
        carrier, area = self.application.classifier.search(mobile)

        key = 'price:{user}:fee:{carrier}:{area}:{price}'.format(
            user=user_id,
            carrier=carrier,
            area=area,
            price=price)

        request_log.info('SET {key} {value}'.format(key=key, value=value))
        master1.set(key, value)

        if route and len(route) > 0:
            key = 'route:{user_id}:fee:{carrier}:{area}:{price}'.format(
                user_id=user_id,
                carrier=carrier,
                area=area,
                price=price)

            value = '{route},{cost}'.format(route=route or 'stub', cost=cost)
            request_log.info('SET {key} {value}'.format(key=key, value=value))
            master1.set(key, value)

        if '8901' in url or '8902' in url:
            product = '&productid='
        else:
            product = ''

        # create order
        q = 'userid={user_id}{product}&price={price}&num=1&mobile={mobile}&spordertime={tsp}&sporderid={order_id}'.format(
            user_id=user_id,
            product=product,
            price=price,
            mobile=mobile,
            tsp=tsp,
            order_id=order_id)

        sign = signature(q, '&key=O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM')

        body = '{query}&sign={sign}&back_url={back_url}'.format(
            query=q,
            sign=sign,
            back_url='http://localhost:8990/callback')

        request_log.info('POST %s - %s' % (url, body))

        http_client = AsyncHTTPClient()
        try:
            response = yield http_client.fetch(url + '/order.do', method='POST', body=body)

            body = response.body.decode('gbk')
            root = et.fromstring(body)

            r_result_no = root.find('resultno').text
            r_order_id = root.find('orderid').text
            r_order_cash = root.find('ordercash').text
            r_sp_order_id = root.find('sporderid').text
            r_mobile = root.find('mobile').text
            r_merchant_submit_time = root.find('merchantsubmittime').text

            request_log.info(r_result_no)
            request_log.info(r_order_id)

        except Exception:
            request_log.exception('')
        finally:
            http_client.close()

            # check callback
