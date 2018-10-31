# -*- coding: utf8 -*-
import logging
import math
import json
import time
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import tornado.ioloop
import tornado.httpserver
import tornado.web
from tornado import gen
import xlsxwriter
import tornado.ioloop
import tornado.httpserver
import tornado.web
from sqlalchemy import desc, or_, and_
import yaml

from db.madeira import get_order_shard
from handler import JsonHandler
from utils.escape import escape_fee_result, escape_area, escape_carrier, escape_data_result, escape_sinopec_result

PRODUCT_LIST = ['fee', 'data', 'sinopec']

request_log = logging.getLogger("purus.request")


def decode_name(slave, order, carrier, carrier_name, area, area_name, master_id, product_cache):
    if order.product == 'data':
        name1 = 'product:{user_id}:data:{carrier}:CN:{face}'.format(
            user_id=master_id,
            carrier=carrier,
            face=order.price)

        if order.scope and order.scope != 'None':
            name1 = name1 + ':' + order.scope

        if name1 in product_cache:
            return product_cache[name1]

        name2 = 'product:{user_id}:data:{carrier}:{area}:{face}'.format(
            user_id=master_id,
            carrier=carrier,
            area=area,
            face=order.price)

        if order.scope and order.scope != 'None':
            name2 = name1 + ':' + order.scope

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
        request_log.error("UNDEFINED PRODUCT: %s", name2)
        return name
    elif order.product == 'sinopec':
        return '中石化{price}元直冲'.format(price=order.price)
    elif order.product == 'fee':
        if order.price:
            return '{area}{carrier_name}{price}元直冲'.format(
                area=area_name,
                carrier_name=carrier_name,
                price=order.price)
        else:
            return '无效的产品'
    else:
        return '(产品定义未同步)'


def decode_status(order):
    if order.product == 'data':
        if order.back_result is None and order.result == '00000':
            return '充值中'
        else:
            return escape_data_result(order.back_result or order.result)
    elif order.product == 'sinopec':
        return escape_sinopec_result(order.back_result or order.result)
    else:
        return escape_fee_result(order.back_result or order.result)


class OrderAdapter:
    def __init__(self, product, dict):
        self.product = product
        self.price = dict.get('price')
        self.scope = dict.get('scope')
        self.result = dict.get('result')
        self.back_result = dict.get('back_result')


class OrderQueryHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super(OrderQueryHandler, self).__init__(application, request)

    @tornado.web.authenticated
    def get(self, product):
        user_list = None
        if 'admin' in self.current_user['roles']:
            downstream = self.application.config['downstream']

            user_list = [{'id': k, 'name': downstream[k]['name'],
                          'tags': downstream[k].get('tags', '')} for k in downstream]
            user_list = sorted(user_list, key=lambda user: int(user['id']))

        self.render('fee_query.html', product=product, user_list=user_list, title=self.application.title)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self, product):

        args = self.json_args

        if 'admin' not in self.current_user['roles'] or 'user_id' not in args:
            args['user_id'] = self.current_user['partner_id']

        if 'admin' in self.current_user['roles'] and args['user_id'] == '':
            http_client = AsyncHTTPClient()
            try:
                url = '%s/query/mongo/%s' % (self.application.config['blocking']['mongo'], product)
                request = HTTPRequest(url=url, method='POST', body=json.dumps(args), request_timeout=120)
                response = yield http_client.fetch(request)

                if response.code == 200:
                    product_cache = dict()  # per-handler cache

                    body = response.body.decode()
                    r = json.loads(body)
                    r1 = []
                    for order in r.get('data'):
                        user_id = order.get('user_id')
                        if user_id not in self.application.config['downstream']:
                            continue

                        if 'master' in self.application.config['downstream'][user_id]:
                            master_id = self.application.config['downstream'][user_id]['master']
                        else:
                            master_id = user_id

                        carrier = ''
                        carrier_name = ''
                        area = ''
                        if order.get('area') and ':' in order.get('area'):
                            carrier, area = order['area'].split(':')
                            carrier_name = escape_carrier(carrier)
                            area_name = escape_area(area)

                        _adapter = OrderAdapter(product, order)

                        order['result'] = decode_status(_adapter)
                        order['name'] = decode_name(self.slave, _adapter, carrier, carrier_name, area, area_name,
                                                    master_id, product_cache)
                        order['carrier'] = area_name + carrier_name
                        if order.product == 'sinopec':
                            order['carrier'] = carrier_name
                        order['user_name'] = self.application.config['downstream'][user_id]['name']
                        r1.append(order)
                    r['data'] = r1
                    self.finish(json.dumps(r))
                else:
                    self.send_error(500)
            except Exception:
                request_log.exception('QUERY CHAIN')
                self.send_error(500)

            finally:
                http_client.close()

        elif self.application.config.get('blocking') and self.application.config['blocking'].get('url'):
            url = '%s/query/block/%s' % (self.application.config['blocking']['url'], product)
            http_client = AsyncHTTPClient()
            try:
                request = HTTPRequest(url=url, method='POST', body=json.dumps(args), request_timeout=120)
                response = yield http_client.fetch(request)

                if response.code == 200:
                    body = response.body.decode('utf8')
                    self.finish(body)
                else:
                    self.send_error(500)
            except Exception:
                request_log.exception('QUERY CHAIN')
                self.send_error(500)

            finally:
                http_client.close()

        else:
            # fallback
            o = OrderBlockingQueryHandler(self.application, self.request)
            o.json_args = args
            o.direct = True
            o.post(product)
            self._headers = o._headers
            self._status_code = o._status_code
            self._write_buffer = o._write_buffer
            self.finish()


class OrderBlockingQueryHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super(OrderBlockingQueryHandler, self).__init__(application, request)
        self.direct = None

    def post(self, product):
        #### SAFTY ######
        safety = self.application.config.get('safety')
        if safety is None:
            request_log.error('CONFIG FAIL (NO SAFETY)')
            return self.send_error(500)

        # verify ip in white list
        if self.direct is None and self.request.remote_ip not in safety['white_list']:
            request_log.error("CONFIG FAIL ('%s'NOT IN WHITELIST)", self.request.remote_ip)
            return self.send_error(500)
        #### SAFTY ######

        if product not in PRODUCT_LIST:
            return self.finish()

        product_cache = dict()

        args = self.json_args

        page = int(args['page'])
        size = int(args['size'])

        user_id = args['user_id']

        ### RELOAD ###
        if user_id not in self.application.config['downstream']:
            cfg = yaml.load(open('downstream.yaml', 'r', encoding='utf8'))
            self.application.config['downstream'] = cfg['downstream']

        if user_id not in self.application.config['downstream']:
            return self.send_error(500)

        session = self.session('madeira')
        try:
            result = []

            if 'master' in self.application.config['downstream'][user_id]:
                master_id = self.application.config['downstream'][user_id]['master']
            else:
                master_id = user_id

            if 'shard_id' in self.application.config['downstream'][user_id]:
                shard_id = self.application.config['downstream'][user_id]['shard_id']
            else:
                shard_id = master_id

            order_cls = get_order_shard(shard_id)

            q = session.query(order_cls).filter(order_cls.product == product).filter(order_cls.user_id == user_id)
            f = False
            # filter
            if 'number' in args and args['number']:
                q = q.filter(order_cls.mobile == args['number'])
                f = True
            if 'start' in args and 'end' in args and args['start'] and args['end']:
                start = time.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
                end = time.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
                q = q.filter(order_cls.req_time >= start).filter(order_cls.req_time < end)
                f = True
            if 'result' in args and args['result']:
                if product == 'fee' or product == 'sinopec':
                    if args['result'] == '-1':
                        q = q.filter(and_(order_cls.result == '0', order_cls.back_result == None))
                    else:
                        q = q.filter(or_(order_cls.back_result == args['result'], order_cls.result == args['result']))
                elif product == 'data':
                    if args['result'] == 'finish':
                        q = q.filter(or_(order_cls.back_result == '00000', order_cls.back_result == '1'))
                    elif args['result'] == 'processing':
                        q = q.filter(and_(order_cls.result == '00000', order_cls.back_result == None))
                    elif args['result'] == 'fail':
                        q = q.filter(or_(and_(order_cls.back_result == None, order_cls.result != '00000'),
                                         and_(order_cls.back_result != None,
                                              order_cls.back_result != '00000',
                                              order_cls.back_result != '1')))
                f = True
            if 'id' in args and args['id']:
                q = q.filter(order_cls.order_id == args['id'])
                f = True
            if 'sp_id' in args and args['sp_id']:
                q = q.filter(order_cls.sp_order_id == args['sp_id'])
                f = True
            if 'carrier' in args and args['carrier']:
                if 'area' in args and args['area']:
                    q = q.filter(order_cls.area == '%s:%s' % (args['carrier'], args['area']))
                else:
                    q = q.filter(order_cls.area.like(args['carrier'] + ':%'))
                f = True
            else:
                if 'area' in args and args['area']:
                    q = q.filter(order_cls.area.like('%:' + args['area']))
                f = True

            if not f and not (page == 1 and size <= 10):
                return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

            count = q.count()
            # print(count)

            max_page = int(math.ceil(count / int(args['size'])))

            q = q.order_by(desc(order_cls.req_time)) \
                .offset((page - 1) * size) \
                .limit(size)

            # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
            for order in q:
                carrier = ''
                carrier_name = ''
                area = ''
                if order.area and ':' in order.area:
                    carrier, area = order.area.split(':')
                    carrier_name = escape_carrier(carrier)
                    area_name = escape_area(area)

                o = {
                    'id': order.order_id,
                    'sp_id': order.sp_order_id,
                    'phone': order.mobile,
                    'price': str(order.price or '-'),
                    'value': (order.value is not None and '%.3f' % (order.value / 10000)) or '-',
                    'create': str(order.req_time),
                    'update': order.back_time and str(order.back_time),
                    'result': decode_status(order),
                    'name': decode_name(self.slave, order, carrier, carrier_name, area, area_name, master_id,
                                        product_cache),
                    'carrier': area_name + carrier_name,
                    'balance': (order.balance is not None and '%0.03f' % (order.balance / 10000)) or '-',
                }
                result.append(o)

        finally:
            session.close()

        self.write(json.dumps({
            'data': result,
            'max': max_page,
            'page': page,
            'size': size
        }))


class OrderExportHandler(OrderQueryHandler):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def post(self, product):

        args = self.json_args
        if 'admin' not in self.current_user['roles'] or 'user_id' not in args:
            args['user_id'] = self.current_user['partner_id']

        if 'blocking' in self.application.config and 'url' in self.application.config['blocking']:
            http_client = AsyncHTTPClient()

            try:
                url = '%s/query/%s/export' % (self.application.config['blocking']['url'], product)

                request = HTTPRequest(url=url, method='POST', body=json.dumps(args), request_timeout=120)
                response = yield http_client.fetch(request)

                if response.code == 200:
                    body = response.body.decode('utf8')
                    self.finish(body)
                else:
                    self.send_error(500)

            except Exception as e:
                request_log.exception('QUERY CHAIN')
                self.send_error(500)

            finally:
                http_client.close()

        else:  # fallback
            o = OrderBlockingQueryHandler(self.application, self.request)
            o.json_args = args
            o.post(product)
            self._headers = o._headers
            self._status_code = o._status_code
            self._write_buffer = o._write_buffer
            self.finish()


class OrderExportBlockingHandler(OrderBlockingQueryHandler):
    @gen.coroutine
    def post(self, product):
        #### SAFTY ######
        safety = self.application.config.get('safety')
        if safety is None:
            request_log.error('CONFIG FAIL (NO SAFETY)')
            return self.send_error(500)

        # verify ip in white list
        if self.request.remote_ip not in safety['white_list']:
            request_log.error("CONFIG FAIL ('%s' NOT IN WHITELIST)", self.request.remote_ip)
            return self.send_error(500)
        #### SAFTY ######

        if product not in PRODUCT_LIST:
            return self.finish()

        product_cache = dict()

        args = self.json_args

        user_id = args['user_id']

        if 'master' in self.application.config['downstream'][user_id]:
            master_id = self.application.config['downstream'][user_id]['master']
        else:
            master_id = user_id

        if 'shard_id' in self.application.config['downstream'][user_id]:
            shard_id = self.application.config['downstream'][user_id]['shard_id']
        else:
            shard_id = master_id

        session = self.session('madeira')

        order_cls = get_order_shard(shard_id)

        q = session.query(order_cls).filter(order_cls.product == product).filter(order_cls.user_id == user_id)
        f = False
        # filter
        if 'number' in args and args['number']:
            q = q.filter(order_cls.mobile == args['number'])
            f = True
        if 'start' in args and 'end' in args and args['start'] and args['end']:
            start = time.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
            end = time.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
            q = q.filter(order_cls.req_time >= start).filter(order_cls.req_time < end)
            f = True
        if 'result' in args and args['result']:
            if product == 'fee':
                if args['result'] == '-1':
                    q = q.filter(and_(order_cls.result == '0', order_cls.back_result == None))
                else:
                    q = q.filter(or_(order_cls.back_result == args['result'], order_cls.result == args['result']))
            elif product == 'data':
                if args['result'] == 'finish':
                    q = q.filter(or_(order_cls.back_result == '00000', order_cls.back_result == '1'))
                elif args['result'] == 'processing':
                    q = q.filter(and_(order_cls.result == '00000', order_cls.back_result == None))
                elif args['result'] == 'fail':
                    q = q.filter(or_(and_(order_cls.back_result == None, order_cls.result != '00000'),
                                     and_(order_cls.back_result != None,
                                          order_cls.back_result != '00000',
                                          order_cls.back_result != '1')))
            f = True
        if 'id' in args and args['id']:
            q = q.filter(order_cls.order_id == args['id'])
            f = True
        if 'sp_id' in args and args['sp_id']:
            q = q.filter(order_cls.sp_order_id == args['sp_id'])
            f = True

        if not f:
            return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

        q = q.order_by(desc(order_cls.req_time)).limit(100000)

        path = 'exports/export_%s.xlsx' % user_id
        workbook = xlsxwriter.Workbook(path, {'constant_memory': True})
        worksheet = workbook.add_worksheet()

        worksheet.write(0, 0, '订单编号')
        worksheet.write(0, 1, '代理商订单编号')
        worksheet.write(0, 2, '手机号')
        worksheet.write(0, 3, '产品名称')
        worksheet.write(0, 4, '运营商')
        worksheet.write(0, 5, '面值')
        worksheet.write(0, 6, '采购金额')
        worksheet.write(0, 7, '开始时间')
        worksheet.write(0, 8, '订单状态')
        worksheet.write(0, 9, '状态时间')
        worksheet.write(0, 10, '余额')

        row = 1
        # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
        for order in q:
            carrier = ''
            carrier_name = ''
            area = ''
            if order.area and ':' in order.area:
                carrier, area = order.area.split(':')
                carrier_name = escape_carrier(carrier)
                area_name = escape_area(area)

            worksheet.write(row, 0, order.order_id)
            worksheet.write(row, 1, order.sp_order_id)
            worksheet.write(row, 2, order.mobile)
            worksheet.write(row, 3, decode_name(self.slave, order, carrier, carrier_name, area, area_name, master_id,
                                                product_cache))
            worksheet.write(row, 4, area_name + carrier_name)
            worksheet.write(row, 5, int(order.price))
            worksheet.write(row, 6, (order.value is not None and (order.value / 10000)) or '-')
            worksheet.write(row, 7, str(order.req_time))
            worksheet.write(row, 8, decode_status(order))
            worksheet.write(row, 9, order.back_time and str(order.back_time) or '')
            worksheet.write(row, 10, (order.balance is not None and (order.balance / 10000)) or '-')
            row += 1

            if row % 1000 == 0:
                yield gen.moment

        workbook.close()
        session.close()

        self.write(json.dumps({'status': 'ok', 'path': path}))

#####################################################################
