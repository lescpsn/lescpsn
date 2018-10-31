import json
import logging
import time

import tornado
from tornado import gen
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop

from handlers import signature
import handlers

request_log = logging.getLogger("madeira.request")
finance_log = logging.getLogger("madeira.finance")
root_log = logging.getLogger()


class CoreHandler(handlers.BaseHandler):
    def __init__(self, application, request, **kwargs):
        super(CoreHandler, self).__init__(application, request)

        # from downstream
        self.order_id = None
        self.user_id = None
        self.price = 0
        self.mobile = None
        self.sp_order_id = None
        self.back_url = None
        self.balance = 0
        self.product = None  # new
        # from upstream
        self.up_order_id = None
        self.up_cost = 0
        # processing
        self.value = 0
        self.route = None
        self.cost = 0
        self.carrier = None
        self.area = None
        # result
        self.result = None
        self.back_result = None
        self.up_result = None
        # timestamp
        self.req_time = time.localtime()
        self.req_time_t = 0
        # self.resp_time = None
        self.up_req_time = None
        self.up_resp_time = None
        # data order
        self.plat_offer_id = None
        self.up_back_result = None
        self.effect_type = None
        self.master_id = None
        self.scope = None
        self.stage = 0

    def routing(self, stage):
        slave = self.slave

        route_list = None

        # TODO:
        scope = self.scope or '0'

        key1 = 'route:{user_id}:{product}:{carrier}:{area}:{scope}:{price}'.format(
            user_id=self.master_id,
            product=self.product,
            carrier=self.carrier,
            area=self.area,
            scope=scope,
            price=self.price)

        key2 = 'route:{user_id}:{product}:{carrier}:CN:{scope}:{price}'.format(
            user_id=self.master_id,
            product=self.product,
            carrier=self.carrier,
            scope=scope,
            price=self.price)

        try:
            route1, route2 = slave.mget(key1, key2)
            route_list = route1 or route2
        except:
            root_log.error("ROUTE ERROR %s", self.order_id)

        if not route_list:
            root_log.error('NO MORE ROUTE1', extra={'orderid': self.order_id})
            return '9999'  # no more route

        route_list = route_list.split(';')

        if len(route_list) < stage:
            root_log.error('NO MORE ROUTE2', extra={'orderid': self.order_id})
            return '5003'  # no more route

        route_cost = route_list[stage - 1]

        # route1,5000;route2,30000@time<3
        if ',' not in route_cost:
            root_log.error('ROUTE MAINTANCE', extra={'orderid': self.order_id})
            return '5003'

        if '@' in route_cost:
            route_cost, condition = route_cost.split('@')

            # support time<delta
            if condition.startswith('time<'):
                delta = int(condition[5:]) * 60
                t1 = time.mktime(time.localtime())
                t0 = self.req_time_t
                if t1 - t0 > delta:
                    root_log.info('CANNOT USE BACKUP, TIMEOUT %0.2f', t1 - t0)
                    return "5003"  # HAVE MORE ROUTE BY CANNOT CATCH-UP

        route, cost = route_cost.split(',')
        if route is None or cost is None:
            return '5003'

        self.route = route
        self.cost = int(cost)

    # update before
    def update_routing(self, stage):
        name = 'order:' + self.order_id
        self.master.hmset(name, {
            'route/%d' % stage: self.route,
            'cost/%d' % stage: self.cost
        })

    # update after
    def update_up_result(self, stage):
        name = 'order:' + self.order_id

        self.master.hmset(name, {
            'up_order_id/%d' % stage: self.up_order_id,
            'up_cost/%d' % stage: str(self.up_cost),
            'up_result/%d' % stage: self.up_result,
            'up_req_time/%d' % stage: self.up_req_time and time.mktime(self.up_req_time),
            'up_resp_time/%d' % stage: self.up_resp_time and time.mktime(self.up_resp_time),
        })

    def refund(self):
        master = self.master

        balance = -1
        try:
            k = 'point:' + self.user_id
            balance = master.incrby(k, self.value)
            finance_log.info('REFUND user=%s, value=%d, balance=%s', self.user_id,
                             self.value, balance, extra={'orderid': self.order_id})
        except:
            finance_log.error('REFUND ERROR user=%s, value=%d, balance=%s', self.user_id,
                              self.value, balance, extra={'orderid': self.order_id})

        # finance record
        # type|income|outcome|balance|order_id|user_id|account|name|t
        finance = 'refund|{income}|0|{balance}|{order_id}|{user_id}|{account}|{name}|{time}'.format(
            income=self.value,
            balance=balance,
            order_id=self.order_id,
            user_id=self.user_id,
            account=self.mobile,
            name='%s:%s:%s:%s' % (self.product, self.carrier, self.area, self.price),
            time=time.mktime(time.localtime()))
        try:
            master.lpush('finance', finance)
            finance_log.info('FINANCE ' + finance, extra={'orderid': self.order_id})
        except Exception as e:
            finance_log.info('FINANCE ERROR' + finance, extra={'orderid': self.order_id})

    def update_upstream(self, refund=False):
        if self.route and self.cost:
            try:
                if refund:
                    self.master.incrby('upstream:%s' % self.route, self.cost)
                else:
                    self.master.incrby('upstream:%s' % self.route, -self.cost)
            except:
                request_log.exception('UPDATE STREAM FAIL', extra={'orderid': self.order_id})

    @tornado.gen.coroutine
    def callback(self, back_result):

        master = self.master

        if back_result == '9':
            self.refund()
            self.update_upstream(refund=True)

        try:
            self.back_result = str(self.back_result or self.up_back_result or self.up_result or back_result)
            master.hset('order:%s' % self.order_id, 'back_result', self.back_result)

        except Exception as e:
            root_log.error("SET", e)

        downstream = self.application.config['downstream'][self.user_id]

        url = self.back_url
        back_time = time.localtime()

        if self.product == 'data':
            body = json.dumps({
                'order_id': self.sp_order_id,
                'transactionid': self.order_id,
                'orderstatus': ((back_result == '1') and 'finish') or 'fail',
                'result_code': self.back_result,
                'plat_offer_id': self.plat_offer_id,
                'facevalue': self.price,
                'phone_id': self.mobile,
                'ordertime': time.strftime("%Y-%m-%d %H:%M:%S", back_time)
            })

        else:
            body = 'userid=%s&orderid=%s&sporderid=%s&merchantsubmittime=%s&resultno=%s' % (
                self.user_id,
                self.order_id,
                self.sp_order_id,
                time.strftime("%Y%m%d%H%M%S", back_time),
                back_result)

            sign = signature(body + '&key=' + downstream['key'])

            body += "&sign=" + sign

        request_log.info('CALLBACK %s - %s' % (url, body), extra={'orderid': self.order_id})

        h = None
        if downstream.get('content'):
            h = {'Content-Type': 'application/json;charset=UTF-8'}

        for i in range(3):
            http_client = AsyncHTTPClient()
            try:
                response = yield http_client.fetch(url, method='POST', headers=h, body=body)

                if response and response.code == 200:
                    break

            except Exception as e:
                request_log.warn('CALLBACK FAIL - %s', e, extra={'orderid': self.order_id})
            finally:
                http_client.close()
            # wait for 5*i secs
            yield gen.sleep(60 * (i + 1))

        # finish order
        back_time = time.localtime()
        try:
            master.hset('order:%s' % self.order_id, 'back_time', time.mktime(back_time))
            master.sadd('list:finish', self.order_id)
            master.srem('list:create', self.order_id)
        except Exception as e:
            root_log.error("MOVE ORDER %s", e)

    @tornado.gen.coroutine
    def dispatch(self):
        master = self.master

        try:
            k = 'order:' + self.order_id
            stage = master.hincrby(k, 'stage')
        except Exception as e:
            root_log.error('STAGE FAIL %s', self.order_id)
            return

        # routing...
        result = self.routing(stage)
        if result:
            # No more routing...
            # back_result from last call, or up_back_result from callback
            self.back_result = self.back_result or self.up_back_result or result  # TODO: verify
            yield self.callback('9')
            return

        # set route info before call.
        self.update_routing(stage)

        result = 9999

        # NEW: check maintain
        m1, m2, m3, m4 = self.master.mget([
            'maintain:%s:%s:CN' % (self.route, self.carrier),
            'maintain:%s:%s:%s' % (self.route, self.carrier, self.area),
            'maintain:%s:%s:CN:%s' % (self.route, self.carrier, self.master_id),
            'maintain:%s:%s:%s:%s' % (self.route, self.carrier, self.area, self.master_id)
        ])

        if m1 or m2 or m3 or m4:
            request_log.info('MAINTAIN %s', m4 or m3 or m2 or m1, extra={'orderid': self.order_id})
            self.up_req_time = time.localtime()
            self.up_resp_time = self.up_req_time
            self.up_result = "10040"
            result = 10040
        else:
            # dispatch
            config = self.application.config['upstream'][self.route]
            if config:
                up_call = getattr(handlers, 'up_' + config['method'])
                try:
                    result = yield up_call(self, config)
                except Exception as e:
                    request_log.error("Call up error: %s", str(e), extra={'orderid': 'UNKNOWN'})

        # 7.update redis
        self.update_up_result(stage)

        # direct return
        cont_flag = True
        if isinstance(result, tuple):
            result, cont_flag = result

        self.back_result = result

        if not cont_flag:
            yield self.callback('9')
            return

        if self.product == 'data':
            if result in [0, 1, 60504, 60599, 60500]:
                self.update_upstream()
                return
            else:
                yield self.dispatch()  # try next route
        else:
            if result in [0, 1]:
                self.update_upstream()
                return  # waiting for callback
            elif result in [5002, 5003]:
                yield self.dispatch()  # try next route
            else:
                request_log.error('ROUTING ERROR %s', result, extra={'orderid': self.order_id})
                return  # logging and waiting for engineer

    def restore_order(self, order_id):
        order_info = self.master.hmget('order:' + order_id, [
            'user_id',  # 0
            'value',  # 1
            'stage',  # 2
            'area',  # 3
            'price',  # 4
            'back_url',  # 5
            'sp_order_id',  # 6
            'mobile',  # 7
            'price',  # 8
            'plat_offer_id',  # 9
            'master_id',  # 10
            'product',  # 11
            'req_time',  # 12
            'scope',  # 13
        ])

        self.order_id = order_id

        self.user_id = order_info[0]
        self.value = int(order_info[1])
        self.stage = int(order_info[2])

        area = order_info[3]
        self.carrier, self.area = area.split(':')
        self.price = order_info[4]
        self.back_url = order_info[5]

        self.sp_order_id = order_info[6]
        self.mobile = order_info[7]
        self.price = order_info[8]

        self.plat_offer_id = order_info[9]
        self.master_id = order_info[10]

        self.route = self.master.hget('order:' + order_id, 'route/%d' % self.stage)
        self.product = order_info[11]

        c = self.master.hget('order:' + order_id, 'cost/%d' % self.stage)

        try:
            self.cost = int(c or 0)
            self.req_time_t = float(order_info[12])
        except:
            self.cost = 0

        if order_info[13] is None or order_info[13] == 'None':
            self.scope = None
        else:
            self.scope = order_info[13]

        return self.stage
