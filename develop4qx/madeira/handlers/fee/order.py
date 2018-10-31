import logging
import time
import xml.etree.ElementTree as ET

import tornado
from tornado.web import MissingArgumentError

from handlers import signature
from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")
finance_log = logging.getLogger("madeira.finance")


class OrderHandler(CoreHandler):
    def logging_request(self):
        status = None
        try:
            uid = int(self.master.incr('uid:order')) % 10000000
            tsp = time.strftime("%Y%m%d%H%M%S", self.req_time)
            site = self.application.config['config']['site']
            self.order_id = 'Q%s%d%07d' % (tsp, site, uid)
        except Exception as e:
            self.order_id = 'CREATE_FAIL'
            status = '9999'

        request_log.info('REQUEST %s - %s %s \n%s',
                         self.request.remote_ip,
                         self.request.method,
                         self.request.uri,
                         self.request.body,
                         extra={'orderid': self.order_id})

        return status

    def finish_with_success(self):
        """
        accept the order and return '0' (waiting for adding value)
        """
        result = '0'
        try:
            self.master.hmset('order:%s' % self.order_id, {
                'result': result,
                'resp_time': time.mktime(time.localtime()),
            })
        except Exception as e:
            request_log.error("FAIL FINISH/SUCCESS %s", e, extra={'orderid': self.order_id})

        order = ET.Element('order')
        ET.SubElement(order, 'resultno').text = result
        ET.SubElement(order, 'orderid').text = self.order_id
        ET.SubElement(order, 'num').text = '1'
        ET.SubElement(order, 'ordercash').text = str(self.value / 10000)
        ET.SubElement(order, 'sporderid').text = self.sp_order_id
        if self.product == 'fee':
            ET.SubElement(order, 'mobile').text = self.mobile
        elif self.product == 'sinopec':
            ET.SubElement(order, 'account_number').text = self.mobile
        ET.SubElement(order, 'merchantsubmittime').text = time.strftime("%Y%m%d%H%M%S", self.req_time)

        self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
        body = ET.tostring(order, encoding='gbk')
        self.finish(body)

        request_log.info('RESPONSE %s', body, extra={'orderid': self.order_id})

    def finish_with_err(self, result):
        """
        reject the order.
        """

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

        order = ET.Element('order')
        ET.SubElement(order, 'orderid').text = self.order_id
        ET.SubElement(order, 'sporderid').text = self.sp_order_id
        ET.SubElement(order, 'resultno').text = str(result)

        self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
        body = ET.tostring(order, encoding='gbk')
        request_log.info('RESPONSE %s', body, extra={'orderid': self.order_id})

        self.finish(body)

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
                request_log.critical('INVALID IP %s %s', remote_ip, self.user_id, extra={'orderid': self.order_id})

        except:
            request_log.exception("EXCEPT CHECKING IP", extra={'orderid': self.order_id})
            return '9999'

    def pricing(self):
        """
        price:user:carrier:area:price
        """
        # get price
        master = self.master

        key = 'price:{user}:{product}:{carrier}:{area}:{price}'.format(
            user=self.user_id,
            product=self.product,
            carrier=self.carrier,
            area=self.area,
            price=self.price)

        try:
            value = self.slave.get(key)
        except:
            value = None

        if value is None:
            request_log.debug('price not exists!!!', extra={'orderid': self.order_id})
            return '5003'

        # cut-off price by price * discount
        value = int(value)

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
            return '9999'

        if stage > 1:
            # TODO: notification
            return '5002'

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

    def parse_product(self):
        """check all argument
        check sign
        """
        product_value = None
        try:
            product_value = self.get_body_argument('product')
            self.product = product_value
        except MissingArgumentError:
            self.product = 'fee'

        if self.product not in ['fee', 'sinopec']:
            request_log.error('UNKNOWN PRODUCT!!!', extra={'orderid': self.order_id})
            return '5012'

        try:
            sign_account_key = None
            if self.product == 'fee':
                self.mobile = self.get_body_argument('mobile')
                sign_account_key = 'mobile'
            elif self.product == 'sinopec':
                self.mobile = self.get_body_argument('account_number')
                sign_account_key = 'account_number'

            self.user_id = self.get_body_argument('userid')
            self.price = self.get_body_argument('price')
            self.sp_order_id = self.get_body_argument('sporderid')
            self.back_url = self.get_body_argument('back_url')

            self.master_id = self.user_id   #

            tsp = self.get_body_argument('spordertime')
            sign = self.get_body_argument('sign').upper()

            # stop flag in config
            if 'stop' in self.application.config['config']:
                request_log.error('STOP FLAG FOUND', extra={'orderid': self.order_id})
                return '5003'

            # verifying...
            num = self.get_body_argument('num')
            if num is None or num != '1':
                return '5012'

            # verifying user
            user = self.application.config['downstream'][self.user_id]
            if user is None or 'key' not in user:
                request_log.error('USERINFO NOT EXIST', extra={'orderid': self.order_id})
                return '5001'

            # check ip
            if self.check_ip(user):
                return '5009'

            # verifying signature
            q = 'userid={userid}&price={price}&num={num}&{sign_account_key}={sign_account_value}&spordertime={tsp}&sporderid={orderid}&key={key}'.format(
                userid=self.user_id,
                price=self.price,
                num=num,
                sign_account_key=sign_account_key,
                sign_account_value=self.mobile,
                tsp=tsp,
                orderid=self.sp_order_id,
                key=user['key'])

            if product_value:
                q = 'product=' + product_value + '&' + q

            sign2 = signature(q)
            if sign != sign2:
                request_log.error('SIGN ERROR %s %s', sign, sign2, extra={'orderid': self.order_id})
                return "5005"

            # dual order
            if self.slave.exists('map:%s:%s' % (self.user_id, self.sp_order_id)):
                request_log.warning('DUAL ORDER %s', self.sp_order_id, extra={'orderid': self.order_id})
                return '5006'

            # verifying mobile
            if self.product in ['fee', 'data']:
                o, a = self.classifier.search(self.mobile)

                if o is None:
                    request_log.warning('UNKNOWN AREA', extra={'orderid': self.order_id})
                    return '5003'

                self.carrier = o
                self.area = a
            elif self.product == 'sinopec':
                self.carrier = 'sinopec'
                self.area = 'CN'

        except MissingArgumentError:
            request_log.exception('MissingArgumentError', extra={'orderid': self.order_id})
            return "5012"

    # Base order info
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
            })

            # add order_id to orderlist
            master.sadd('list:create', self.order_id)
            master.sadd('list:save', self.order_id)
            master.set('map:%s:%s' % (self.user_id, self.sp_order_id), self.order_id)
        except Exception as e:
            request_log.error('SAVE ORDER FAIL %s', e, extra={'orderid': self.order_id})

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
        if code not in ['5005', '5006']:
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
