import json
import logging
import time

import tornado.gen

from handlers import BaseHandler

request_log = logging.getLogger("madeira.request")

CACHE_TIME = 120


class DataQueryHandler(BaseHandler):
    prod_cache = {}

    def balance(self, args):
        user_id = args['partner_no']

        b = self.slave.get('point:' + user_id)

        if b:
            b = int(b)
        else:
            b = 0

        self.finish(json.dumps({
            'partner_no': user_id,
            'balance': b / 10000,
        }))

    @tornado.gen.coroutine
    def query_from_mongo(self, user_id, sp_order_id):

        request_log.info('FROM MONGO %s %s', user_id, sp_order_id, extra={'orderid': 'DATA QUERY'})

        try:
            order_collection = self.application.glados_client.GLaDOS.order
            order_doc = yield order_collection.find_one({'user_id': user_id, 'sp_order_id': sp_order_id})

            if order_doc:
                result = order_doc.get('back_result') or order_doc.get('result')
                if order_doc.get('back_result') is None:
                    if order_doc.get('result') in ['00000', '0', '1']:
                        status = 'processing'
                    else:
                        status = 'fail'
                else:
                    if order_doc.get('back_result') in ['00000', '1']:
                        status = 'finish'
                    else:
                        status = 'fail'

                order_info = {
                    'order_id': sp_order_id,
                    'transactionid': order_doc.get('_id'),
                    'orderstatus': status,
                    'result_code': result,
                    'plat_offer_id': '',
                    'facevalue': order_doc.get('price'),
                    'phone_id': order_doc.get('mobile'),
                    'ordertime': order_doc.get('req_time').strftime("%Y-%m-%d %H:%M:%S")
                }

            else:
                request_log.info('MONGO NOT EXIST %s', sp_order_id, extra={'orderid': 'DATA QUERY'})
                order_info = {'result_code': '5007'}

            return order_info

        except:
            request_log.exception('MONGO FAIL', extra={'orderid': 'DATA QUERY'})

        return {}

    @tornado.gen.coroutine
    def query(self, args):

        slave = self.slave
        user_id = args['partner_no']
        sp_order_id = args['request_no']

        order_id = slave.get('map:%s:%s' % (user_id, sp_order_id))

        if order_id:
            # {"order_id":"111111","transactionid":"2222222","orderstatus":"0"," plat_offer_id":"10002",
            # " facevalue":"10","phone_id":"18918918918","ordertime":"2014-04-04 10:24:001 "}
            # order_id = order_id
            info = slave.hmget('order:' + order_id,
                               ['result', 'back_result', 'plat_offer_id', 'price', 'mobile', 'req_time', 'user_id'])

            if user_id != info[6]:
                return self.send_error(500)

            result = info[1] or info[0]
            if info[1] is None:
                if info[0] == '00000' or info[0] == '0' or info[0] == '1':
                    status = 'processing'
                else:
                    status = 'fail'
            else:
                if info[1] == '00000' or info[1] == '1':
                    status = 'finish'
                else:
                    status = 'fail'

            t = time.localtime(float(info[5]))

            order_info = {
                'order_id': sp_order_id,
                'transactionid': order_id,
                'orderstatus': status,
                'result_code': result,
                'plat_offer_id': info[2],
                'facevalue': info[3],
                'phone_id': info[4],
                'ordertime': time.strftime("%Y-%m-%d %H:%M:%S", t)
            }

        else:
            order_info = yield self.query_from_mongo(user_id, sp_order_id)

        resq = json.dumps(order_info)
        # request_log.info('OUT %s', resq, extra={'orderid': 'DATA QUERY'})

        self.finish(resq)

    @tornado.gen.coroutine
    def prod(self, args):
        user_id = args['partner_no']
        prods = []

        tsp = int(time.time())

        if user_id in DataQueryHandler.prod_cache:
            cached = DataQueryHandler.prod_cache.get(user_id)

            if (tsp - cached['tsp']) <= CACHE_TIME:
                request_log.info('FROM CACHE %s', user_id, extra={'orderid': 'QUERY PROD'})
                self.finish(json.dumps({'prodlist': cached['data']}, indent=2))
                return

        slave = self.slave

        down_steam = self.application.config['downstream'][user_id]

        if 'master' in down_steam:
            user_id = down_steam['master']

        request_log.info('USER %s' % user_id, extra={'orderid': 'QUERY PROD'})

        key = 'product:{user_id}:data:*'.format(user_id=user_id)

        cursor = 0

        n = 0
        for n in range(10000):
            cursor, key_list = slave.scan(cursor, key, 1000)

            for p_key in key_list:
                prod = slave.hmget(p_key, ['offer', 'value', 'discount', 'name'])

                prods.append({
                    'prodname': prod[3],
                    'carddesc': '',
                    'plat_offer_id': prod[0],
                    'facevalue': prod[1],
                    'rate': int(prod[2]) / 10000
                })

            if cursor == 0:
                yield tornado.gen.sleep(0.3)
                break

        request_log.info('SCAN AFTER %d' % n, extra={'orderid': 'QUERY PROD'})

        DataQueryHandler.prod_cache[user_id] = {
            'tsp': tsp,
            'data': sorted(prods, key=lambda p: p['plat_offer_id'])
        }

        self.finish(json.dumps({'prodlist': sorted(prods, key=lambda p: p['plat_offer_id'])}, indent=2))

    @tornado.gen.coroutine
    def post(self, query):
        body = self.request.body.decode('utf8')

        args = json.loads(body)

        if query == 'prod':
            yield self.prod(args)
        elif query == 'query':
            yield self.query(args)
        elif query == 'balance':
            self.balance(args)
        else:
            self.finish()
