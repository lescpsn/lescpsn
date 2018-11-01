import base64
import json
import logging
import time

import tornado
from Crypto.Cipher import AES

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")
finance_log = logging.getLogger("madeira.finance")


def unpad(s):
    return s[0:-ord(s[-1])]


class DataOrderHandler(CoreHandler):
    # 1
    def logging_request(self):
        status = None
        try:
            uid = int(self.master.incr('uid:order')) % 10000000
            tsp = time.strftime("%Y%m%d%H%M%S", self.req_time)
            site = self.application.config['config']['site']
            self.order_id = 'Q%s%d%07d' % (tsp, site, uid)
        except Exception as e:
            self.order_id = 'CREATE_FAIL'
            status = '99999'

        request_log.info('REQUEST %s - %s %s \n%s',
                         self.request.remote_ip,
                         self.request.method,
                         self.request.uri,
                         self.request.body,
                         extra={'orderid': self.order_id})

        return status

    # 2
    def parse_product(self):
        """check all argument
        check sign
        """
        try:
            input = json.loads(self.request.body.decode('utf8'))
            self.user_id = input['partner_no']

            user = self.application.config['downstream'][self.user_id]
            if user is None or 'pass' not in user:
                return '10006'

            if 'master' in user:
                self.master_id = user['master']
            else:
                self.master_id = self.user_id

            # check ip
            if self.check_ip(user):
                return '5009'

            if self.check_capability(user):
                return '10044'

            passphrase = user['pass']
            iv = user['iv']

            code = input['code']

            aes = AES.new(passphrase, AES.MODE_CBC, iv)
            encrypted = aes.decrypt(base64.b64decode(code))
            code = unpad(encrypted.decode('utf8'))

            request_log.info('REQUEST CODE %s', code, extra={'orderid': self.order_id})

            arguments = json.loads(code)

            if len(arguments['phone_id']) > 11:
                return '10007'

            self.mobile = arguments['phone_id']
            self.price = int(arguments['facevalue'])
            self.sp_order_id = arguments['order_id']
            self.back_url = user['back_url']
            self.plat_offer_id = arguments['plat_offer_id']

            if 'effect_type' in arguments:
                self.effect_type = arguments['effect_type']
            else:
                self.effect_type = '1'

            # dual order
            if self.slave.exists('map:%s:%s' % (self.user_id, self.sp_order_id)):
                request_log.warning('DUAL ORDER %s', self.sp_order_id, extra={'orderid': 'UNKNOWN'})
                return '10008'

            # verifying mobile
            o, a = self.classifier.search(self.mobile)

            if o is None:
                request_log.debug('AREA UNKNOWN', extra={'orderid': 'UNKNOWN'})
                return '10007'

            self.product = 'data'
            self.carrier = o
            self.area = a

        except Exception as e:
            request_log.exception('PARSE ERROR', extra={'orderid': 'UNKNOWN'})
            return "10007"

    # 2.1
    def check_ip(self, user):
        try:
            key = 'safe:ip:%s' % self.user_id
            remote_ip = self.request.remote_ip

            if self.slave.sismember(key, remote_ip):
                return

            ip_num = 1
            if 'ip_num' in user:
                ip_num = int(user['ip_num'])

            # not member
            if self.slave.scard(key) < ip_num:
                request_log.critical('ADDING IP %s <= %s', self.user_id, remote_ip, extra={'orderid': self.order_id})
                self.master.sadd(key, remote_ip)
                return

            if self.slave.exists('safe:enforce') or self.slave.exists('safe:enforce:%s' % self.user_id):
                return '9005'
            else:
                request_log.warn('INVALID IP %s %s', remote_ip, self.user_id, extra={'orderid': self.order_id})

        except:
            request_log.exception("EXCEPT CHECKING IP")
            return '9999'

    # 2.2
    def check_capability(self, user):
        # user not used yet.
        SEGMENT = 10
        HARD_LIMIT = 500

        try:
            cap = 'c:%d' % int(time.time() % 86400 / SEGMENT)  # 3600 * 24 = 86400 seconds per day

            c = self.master.incr(cap)
            if c > HARD_LIMIT:
                request_log.warn('OVER CAPABILITY %d', c)
                # return 10044

            if c == 1:
                self.master.expire(cap, 600)
        except:
            request_log.exception('EXCPTION CHECK CAPABILITY')
            return '99999'

    # 3 Base order info
    def save_order1(self):
        master = self.master
        name = 'order:' + self.order_id

        try:
            master.hmset(name, {
                'product': self.product,
                'user_id': self.user_id,
                'price': self.price,
                'mobile': self.mobile,
                'sp_order_id': self.sp_order_id,
                'back_url': self.back_url,
                'req_time': self.req_time and time.mktime(self.req_time),
                'area': '%s:%s' % (self.carrier, self.area),
                'master_id': self.master_id,
            })

            # add order_id to orderlist
            master.sadd('list:create', self.order_id)
            master.sadd('list:save', self.order_id)
            master.set('map:%s:%s' % (self.user_id, self.sp_order_id), self.order_id)
        except Exception as e:
            request_log.error('SAVE ORDER FAIL %s', e, extra={'orderid': self.order_id})

    # 4
    def pricing(self):
        """
        price:user:carrier:area:price
        """
        # get price
        master = self.master

        try:
            # scope by offer_id
            self.scope = master.get('scope:%s' % self.plat_offer_id[2:])

            if self.scope:
                key1 = 'price:{user}:data:{carrier}:{area}:{scope}:{price}'.format(
                    user=self.master_id, carrier=self.carrier, area=self.area, price=self.price,
                    scope=self.scope)

                key2 = 'price:{user}:data:{carrier}:{scope}:{price}'.format(
                    user=self.master_id, carrier=self.carrier, area=self.area, price=self.price,
                    scope=self.scope)

                v1, v2 = self.slave.mget(key1, key2)
                value = v1 or v2
            else:
                key1 = 'price:{user}:data:{carrier}:{area}:{price}'.format(
                    user=self.master_id, carrier=self.carrier, area=self.area, price=self.price)

                key2 = 'price:{user}:data:{carrier}:{price}'.format(
                    user=self.master_id, carrier=self.carrier, price=self.price)

                v1, v2 = self.slave.mget(key1, key2)
                value = v1 or v2
        except:
            value = None

        if value is None:
            request_log.debug('PRICE VALUE IS NONE', extra={'orderid': 'UNKNOWN'})
            return '10007'

        v, offer_id = value.split(',')
        value = int(v)

        if offer_id != self.plat_offer_id:
            request_log.debug('offer_id != plat_offer_id', extra={'orderid': 'UNKNOWN'})
            return '10007'

        try:
            master.hmset('order:' + self.order_id, {'plat_offer_id': offer_id, 'scope': self.scope})
        except Exception as e:
            pass

        # point
        k = 'point:%s' % self.user_id
        stage = 0
        balance = -1
        try:
            balance = master.incr(k, -value)
            stage += 1  # stage-1 : charged
            if balance < 0:
                stage += 1  # stage-2: try to refund
                balance = master.incr(k, value)
                stage += 1  # stage-3: refund success

            finance_log.info('FUND user=%s, value=%d, balance=%s, stage=%d', self.user_id,
                             value, balance, stage, extra={'orderid': self.order_id})
        except Exception as e:
            finance_log.error('FUND ERROR user=%s, value=%d, balance=%s, stage=%d',
                              self.user_id, value, balance, stage, extra={'orderid': self.order_id})
            return '99999'
        if stage > 1:
            # TODO: notification
            return '60002'

        # request_log.info('FUND %s->%d' % (self.user_id, value), extra={'orderid': self.order_id})
        self.value = value  # write down

        # type|income|outcome|balance|order_id|user_id|account|name|t
        finance = 'debit|0|{outcome}|{balance}|{order_id}|{user_id}|{account}|{name}|{time}'.format(
            outcome=self.value,
            balance=balance,
            order_id=self.order_id,
            user_id=self.user_id,
            account=self.mobile,
            name='%s:%s:%s:%s' % (self.product, self.carrier, self.area, self.price),
            time=time.mktime(time.localtime()))

        try:
            master.lpush('finance', finance)
            finance_log.info('FINANCE ' + finance, extra={'orderid': self.order_id})

            master.hmset('order:' + self.order_id, {
                'value': str(self.value),
                'balance': balance,
            })
        except Exception as e:
            finance_log.error('FINANCE ERROR' + finance, extra={'orderid': self.order_id})

    # 5
    def finish_with_success(self):
        # accept the order and return '00000'

        result = '00000'

        try:
            self.master.hmset('order:%s' % self.order_id, {
                'result': '00000',
                'resp_time': time.mktime(time.localtime()),
            })
        except Exception as e:
            request_log.error("FAIL FINISH/SUCCESS %s", e, extra={'orderid': self.order_id})

        # self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
        body = json.dumps({'request_no': self.sp_order_id,
                           'orderstatus': 'processing',
                           'result_code': result})

        self.finish(body)

        request_log.info('RESPONSE %s', body, extra={'orderid': self.order_id})

    # any
    def finish_with_err(self, result):
        # reject the order.
        # move order in redis

        if self.order_id:
            try:
                self.master.hmset('order:%s' % self.order_id, {
                    'result': str(result),
                    'resp_time': time.mktime(time.localtime()),
                })

                self.master.smove('list:create', 'list:finish', self.order_id)
            except Exception as e:
                request_log.error("FAIL FINISH/ERR %s", e, extra={'orderid': self.order_id})

        # self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger

        body = json.dumps({'request_no': self.sp_order_id or '-',
                           'orderstatus': 'fail',
                           'result_code': str(result)})

        request_log.info('RESPONSE %s', body, extra={'orderid': self.order_id})

        self.finish(body)

    @tornado.gen.coroutine
    def post(self):

        # create order_id & logging
        code = self.logging_request()
        if code:
            return self.finish_with_err(code)

        # check input, get product, create order
        # search for carrier & area
        # write to redis
        code = self.parse_product()
        self.save_order1()

        if code:
            return self.finish_with_err(code)

        # pricing
        code = self.pricing()

        # update order info
        if code:
            return self.finish_with_err(code)
        else:
            self.finish_with_success()
        # #########################################

        yield self.dispatch()
