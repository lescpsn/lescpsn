# *-* coding:utf-8 -*-
import base64
import json
import logging
import math
import pymongo
import tornado.gen
import tornado.httpserver
import tornado.ioloop
import tornado.web
from Crypto.Cipher import AES
from datetime import datetime
from tornado.httpclient import AsyncHTTPClient

from handler import JsonHandler
from secret import padding
from utils.escape import escape_fee_result, escape_area, escape_carrier, escape_data_result, escape_sinopec_result, \
    escape_finance_type

PRODUCT_LIST = ['fee', 'data', 'sinopec']

request_log = logging.getLogger("purus.request")


def decode_name(slave, order, carrier, carrier_name, area, area_name, master_id, product_cache):
    if order.get('product') == 'data':
        name1 = 'product:{user_id}:data:{carrier}:CN:{face}'.format(
            user_id=master_id,
            carrier=carrier,
            face=order.get('price'))

        if order.get('scope') and order.get('scope') != 'None':
            name1 = name1 + ':' + order.get('scope')

        if name1 in product_cache:
            return product_cache[name1]

        name2 = 'product:{user_id}:data:{carrier}:{area}:{face}'.format(
            user_id=master_id,
            carrier=carrier,
            area=area,
            face=order.get('price'))

        if order.get('scope') and order.get('scope') != 'None':
            name2 = name2 + ':' + order.get('scope')

        if name2 in product_cache:
            return product_cache[name2]

        name = slave.hget(name1, 'name')

        if name is not None:
            product_cache[name1] = name
            return name

        name = slave.hget(name2, 'name')
        if name is not None:
            product_cache[name2] = name
            return name

        name = '(产品定义未同步)'
        if area != 'CN':
            product_cache[name2] = name
            request_log.error("UNDEFINED PRODUCT: [%s] [%s]", name2, name1)
        return name

    elif order.get('product') == 'sinopec':
        return '中石化{price}元直冲'.format(price=order.get('price'))

    else:
        return '{area}{carrier_name}{price}元直冲'.format(
            area=area_name,
            carrier_name=carrier_name,
            price=order.get('price'))


def decode_status(order):
    if order.get('product') == 'data':
        if order.get('back_result') is None and (order.get('result') == '00000' or order.get('result') == 'None'):
            return '充值中'
        else:
            return escape_data_result(order.get('back_result') or order.get('result'))

    elif order.get('product') == 'sinopec':
        return escape_sinopec_result(order.get('back_result') or order.get('result'))

    else:
        return escape_fee_result(order.get('back_result') or order.get('result'))


class ApiQueryOrderHandler(JsonHandler):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self, product):

        args = self.json_args
        page = args.get('page')
        size = args.get('size')
        max_page = 0

        product_cache = dict()
        result = []

        try:
            if 'admin' not in self.current_user['roles']:
                user_id = self.current_user['partner_id']
            else:
                user_id = args.get('user_id')

            criteria = {'product': product}

            if user_id:
                criteria['user_id'] = user_id

            if args.get('account'):
                criteria['mobile'] = args.get('account')

            if args.get('start') and args.get('end'):
                start = datetime.strptime(args.get('start'), '%Y/%m/%d %H:%M:%S')
                end = datetime.strptime(args.get('end'), '%Y/%m/%d %H:%M:%S')


                criteria['req_time'] = {'$gte': start, '$lt': end}

            if args.get('result'):
                if args.get('result') == 'processing':
                    criteria['$and'] = [{'result': {'$in': ['00000', '0']}}, {'back_result': None}]

                # 1 and finish
                elif args.get('result') == 'success':
                    criteria['$or'] = [{'back_result': '1'}, {'result': '1'}, {'back_result': '00000'}]

                # fail
                elif args.get('result') == 'fail':
                    criteria['$or'] = [{'$and': [{'back_result': None}, {'result': {'$nin': ['00000', '0']}}]},
                                       {'back_result': {'$nin': [None, '00000', '1']}}]

            if args.get('id'):
                criteria['_id'] = args.get('id')

            if args.get('sp_id'):
                criteria['sp_order_id'] = args.get('sp_id')

            if args.get('carrier'):
                if args.get('area'):
                    criteria['area'] = '%s:%s' % (args.get('carrier'), args.get('area'))
                else:
                    criteria['area'] = {'$regex': ('^' + args.get('carrier') + ':.{2}')}

            elif args.get('area'):
                criteria['area'] = {'$regex': ('.:' + args.get('area') + '$')}

            if len(criteria) <= 1:
                return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

            order_collection = self.application.glados_client.GLaDOS.order

            count = yield order_collection.find(criteria).count()

            max_page = int(math.ceil(count / int(args['size'])))

            cursor = order_collection.find(criteria).sort([('req_time', pymongo.DESCENDING)]).skip(
                (page - 1) * size).limit(size)

            # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
            while (yield cursor.fetch_next):
                order_doc = cursor.next_object()

                carrier = ''
                carrier_name = ''
                area = order_doc.get('area')
                if area and ':' in area:
                    carrier, area = area.split(':')
                    carrier_name = escape_carrier(carrier)
                    area_name = escape_area(area)

                if user_id in self.application.config['downstream']:
                    master_id = self.application.config['downstream'][user_id].get('master')
                else:
                    master_id = user_id

                o = {
                    'id': order_doc.get('_id'),
                    'sp_id': order_doc.get('sp_order_id'),
                    'account': order_doc.get('mobile'),
                    'price': str(order_doc.get('price') or '-'),
                    'value': (order_doc.get('value') and '%.3f' % (order_doc.get('value') / 10000)) or '-',
                    'create': str(order_doc.get('req_time')),
                    'update': str(order_doc.get('back_time') or ''),
                    'result': decode_status(order_doc),
                    'name': decode_name(self.slave, order_doc, carrier, carrier_name, area, area_name, master_id,
                                        product_cache),
                    'carrier': area_name + carrier_name,
                    'balance': (order_doc.get('balance') and '%0.03f' % (order_doc.get('balance') / 10000)) or '-',
                }

                result.append(o)
        except:
            request_log.exception('FAIL ON QUERY2')

        self.write(json.dumps({
            'count': count,
            'data': result,
            'max': max_page,
            'page': page,
            'size': size
        }))


class ApiQueryFinanceHandler(JsonHandler):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):

        args = self.json_args
        page = args.get('page')
        size = args.get('size')
        max_page = 0

        result = []

        try:
            if 'admin' not in self.current_user['roles']:
                user_id = self.current_user['partner_id']
            else:
                user_id = args.get('user_id')

            criteria = {}

            if user_id:
                criteria['user_id'] = user_id

            if args.get('order_id'):
                criteria['order_id'] = args.get('order_id')

            if args.get('account'):
                criteria['account'] = args.get('account')

            if args.get('start') and args.get('end'):
                start = datetime.strptime(args.get('start'), '%Y/%m/%d %H:%M:%S')
                end = datetime.strptime(args.get('end'), '%Y/%m/%d %H:%M:%S')


                criteria['create_time'] = {'$gte': start, '$lt': end}

            if args.get('type'):
                criteria['type'] = args.get('type')

            if len(criteria) <= 1:
                return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

            trans_collection = self.application.glados_client.GLaDOS.transaction

            request_log.info('QUERY FINANCE %s', criteria)

            count = yield trans_collection.find(criteria).count()

            request_log.info('QUERY FINANCE COUNT=%d', count)

            max_page = int(math.ceil(count / int(args['size'])))

            cursor = trans_collection.find(criteria).sort([('_id', -1)]).skip((page - 1) * size).limit(size)

            while (yield cursor.fetch_next):
                trans_doc = cursor.next_object()

                name = ''
                if trans_doc.get('name'):
                    n = trans_doc.get('name').split(':')
                    if len(n) == 3:
                        c = escape_carrier(n[0])
                        p = escape_area(n[1])
                        v = n[2]
                        name = '%s%s%s元直充' % (p, c, v)

                t = {
                    'id': trans_doc.get('_id'),
                    'user_id': trans_doc.get('user_id'),
                    'type': escape_finance_type(trans_doc.get('type')),
                    'value': '%.3f' % ((trans_doc.get('income') - trans_doc.get('outcome')) / 10000),
                    'balance': '%.3f' % (trans_doc.get('balance') / 10000),
                    'order_id': trans_doc.get('order_id'),
                    'account': trans_doc.get('account'),
                    'time': str(trans_doc.get('create_time')),

                    'name': trans_doc.get('name'),
                    'notes': trans_doc.get('notes') or ''
                }

                result.append(t)

        except:
            request_log.exception('FAIL ON QUERY2')

        self.write(json.dumps({
            'data': result,
            'max': max_page,
            'page': page,
            'size': size
        }))


class ApiExportRequestHandler(JsonHandler):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self, product):

        args = self.json_args
        user_id = self.current_user['partner_id']
        args['user_id'] = user_id
        args['criteria']['product'] = product

        if 'admin' not in self.current_user['roles']:
            args['criteria']['user_id'] = user_id

        body = json.dumps(args)

        http_client = AsyncHTTPClient()

        try:
            downstream = self.application.config['downstream'][user_id]

            iv = downstream['iv']
            passphrase = downstream['pass']
            aes = AES.new(passphrase, AES.MODE_CBC, iv)

            b = aes.encrypt(padding(body))
            encrypted = base64.b64encode(b).decode()

            base_url = self.application.config['connection']['glados_hall']
            url = base_url + '/export/request'
            headers = {'User': user_id}

            response = yield http_client.fetch(url, method='POST', headers=headers, body=encrypted)
            resp = response.body.decode()

            self.finish(resp)

        except:
            request_log.exception('EXPORT FAIL')
            self.finish(json.dumps({'status': 'fail', 'msg': '导出异常，请稍后尝试'}))

        finally:
            http_client.close()
