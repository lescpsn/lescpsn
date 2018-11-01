# -*- coding: utf8 -*-
import json
import logging
import math
import datetime
import base64
import pymongo
import tornado.web
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

from Crypto.Cipher import AES

from handler import JsonHandler
from utils.escape import escape_data_result, escape_fee_result, escape_carrier, escape_area, escape_upstream
from db.purus import Operation

request_log = logging.getLogger("purus.request")


# 查列表
class QueryOrderListHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):
        args = self.json_args
        page = args.get('page')
        size = args.get('size')

        interface_map = self.application.config.get('interface')

        try:
            # find
            order_collection = self.application.glados_client.GLaDOS.order

            filter_dict = {}

            #订单类型
            if 'supply_type' in args and args['supply_type']:
                filter_dict['truman_order.supply_type'] = args['supply_type']

            #订单编号
            if 'id' in args and args['id']:
                filter_dict['_id'] = args['id']

            # 采购商
            if 'user_id' in args and args['user_id']:
                filter_dict['user_id'] = args['user_id']

            #供货商
            if 'supply_user_id' in args and args['supply_user_id']:
                filter_dict['truman_order.user_id'] = args['supply_user_id']

            #产品  [流量，话费，油卡]
            if 'product' in args and args['product']:
                filter_dict['product'] = args['product']

            #充值账号
            if 'phone' in args and args['phone']:
                filter_dict['mobile'] = args['phone']

            #起始与结束时间
            if 'start' in args and 'end' in args and args['start'] and args['end']:
                # 2015/08/02 09:49:32
                start = datetime.datetime.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
                end = datetime.datetime.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
                filter_dict['req_time'] = {'$gte': start, '$lte': end}

            #订单状态
            if 'state' in args and args['state']:
                # -1 and processing
                if args['state'] == 'processing':
                    filter_dict['$and'] = [{'result': {'$in': ['00000', '0']}}, {'back_result': None}]

                # 1 and finish
                elif args['state'] == 'success':
                    filter_dict['$or'] = [{'back_result': '1'}, {'result': '1'}, {'back_result': '00000'}]

                # fail
                elif args['state'] == 'fail':
                    filter_dict['$or'] = [{'$and': [{'back_result': None}, {'result': {'$nin': ['00000', '0']}}]},
                                          {'back_result': {'$nin': [None, '00000', '1']}}]

            #运营商
            if 'carrier' in args and args['carrier']:
                if 'area' in args and args['area']:
                    filter_dict['area'] = '%s:%s' % (args['carrier'], args['area'])
                else:
                    filter_dict['area'] = {'$regex': ('^' + args['carrier'] + ':.{2}')}
            else:
                if 'area' in args and args['area']:
                    filter_dict['area'] = {'$regex': ('.:' + args['area'] + '$')}

            #上游路由
            if args.get('route'):
                filter_dict['up_order.route'] = args.get('route')



            if len(filter_dict) == 0:
                return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

            count = yield order_collection.find(filter_dict).count()

            max_page = int(math.ceil(count / int(args['size'])))

            cursor = order_collection.find(filter_dict).sort([('req_time', pymongo.DESCENDING)]).skip(
                (page - 1) * size).limit(size)

            data_list = []
            product_cache = dict()  # per-handler cache

            while (yield cursor.fetch_next):
                order_doc = cursor.next_object()

                # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号  订单状态	备注
                o = {'id': order_doc.get('_id'),
                     'sp_id': order_doc.get('sp_order_id'),
                     'shard': order_doc.get('shard'),
                     'phone': order_doc.get('mobile'),
                     # 'value': (order_doc.get('value') is not None and '%.3f' % (order_doc.get('value') / 10000)) or '-',
                     'create': str(order_doc.get('req_time')),
                     'update': order_doc.get('back_time') and str(order_doc.get('back_time')),
                     # 'balance': (order_doc.get('balance') is not None and '%0.03f' % (
                     #    order_doc.get('balance') / 10000)) or '-',
                     'product': order_doc.get('product'),
                     'result': order_doc.get('result'),
                     'price': order_doc.get('price'),
                     'scope': order_doc.get('scope'),
                     'back_result': order_doc.get('back_result'),
                     'area': order_doc.get('area'),

                     'user_id': order_doc.get('user_id'),   #采购商
                     'supply_user_id': order_doc.get('truman_order', {}).get('user_id'),  #供货商

                     'value': order_doc.get('value'),   #采购价
                     'sell_value': order_doc.get('truman_order', {}).get('sell_price'),  #供货价
                     }

                if order_doc.get('up_order'):
                    route = order_doc.get('up_order')[-1].get('route')
                    o['route'] = interface_map.get(route, route)

                user_id = order_doc.get('user_id')
                supply_user_id = o['supply_user_id']

                if 'user_id' in self.application.config['downstream'] and 'master' in \
                        self.application.config['downstream'][user_id]:
                    master_id = self.application.config['downstream'][user_id]['master']
                else:
                    master_id = user_id

                carrier = ''
                carrier_name = ''
                area = ''

                if order_doc.get('area') and ':' in order_doc.get('area'):
                    carrier, area = order_doc['area'].split(':')
                    carrier_name = escape_carrier(carrier)
                    area_name = escape_area(area)

                o['result'] = decode_status(order_doc)
                o['name'] = decode_name(self.slave, order_doc, carrier, carrier_name, area, area_name,
                                        master_id, product_cache)

                o['carrier'] = area_name + carrier_name

                service_url = None
                if user_id in self.application.config['downstream']:
                    o['user_name'] = self.application.config['downstream'][user_id]['name']
                    service_url = self.application.config['downstream'][user_id]['shard']

                if supply_user_id in self.application.config['downstream']:
                    o['supply_user_name'] = self.application.config['downstream'][supply_user_id]['name']

                if not o.get('route') and service_url:
                    _id = order_doc.get('_id')
                    url = 'http://%s/admin/info?order_id=%s' % (service_url, _id)
                    result = yield get_route(url)

                    if result:
                        route = result.get('route/1')
                        if route:
                            o['route'] = '_' + str(interface_map.get(route, route))

                data_list.append(o)

            self.finish(json.dumps({'data': data_list,
                                    'max': max_page,
                                    'page': page,
                                    'size': size}))

        except Exception:
            request_log.exception('QUERY CHAIN')
            self.send_error(500)


# 查详情
class QueryOrderDetailHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):
        args = self.json_args

        http_client = AsyncHTTPClient()

        try:
            db1 = self.application.glados_client.GLaDOS.order

            order_id = args['id']

            order = yield db1.find_one(order_id)

            up_order_list = order.get('up_order', [])
            product = order.get('product')

            detail_list = []

            for up_order in up_order_list:
                up_info = {'title': '上游订单'}
                content_list = []
                up_info['content'] = content_list

                content_list.append({'k': '上游订单号', 'v': up_order.get('up_order_id') or '无'})
                content_list.append({'k': '渠道', 'v': up_order.get('route')})
                content_list.append({'k': '请求时间', 'v': str(up_order.get('up_req_time') or '暂无')})
                content_list.append({'k': '返回时间', 'v': str(up_order.get('up_resp_time') or '暂无')})
                content_list.append({'k': '回调时间', 'v': str(up_order.get('up_back_time') or '暂无')})
                content_list.append({'k': '订单结果', 'v': up_order.get('up_result', '暂无')})

                if up_order.get('up_back_result'):
                    if product == 'fee':
                        content_list.append({'k': '充值结果', 'v': escape_fee_result(up_order.get('up_back_result'))})
                    elif product == 'data':
                        content_list.append({'k': '充值结果', 'v': escape_data_result(up_order.get('up_back_result'))})
                else:
                    content_list.append({'k': '充值结果', 'v': '暂无'})

                detail_list.append(up_info)  # 返回页面

                if up_order.get('route') == 'machado':

                    base_url = self.application.config['connection']['forrestal_query']
                    base_url += '/cmcc_fee/query_order?requ_type=by_order_id&order_id=' + order_id

                    data = yield get_route(base_url)
                    if data.get('status') == 'ok':
                        forrestal_order = data['data']['order_list'][0]

                        card_info = {'title': '卡充信息', 'content': []}
                        card_info['content'].append({'k': '手机', 'v': forrestal_order.get('mobile', '无')})
                        card_info['content'].append({'k': '卡号', 'v': forrestal_order.get('card_id', '无')})
                        card_info['content'].append({'k': '结果', 'v': decode_agent(forrestal_order.get('result'))})
                        detail_list.append(card_info)

                        agent_index = 1
                        for agent in forrestal_order.get('agents'):
                            agent_info = {'title': '拨打 #' + str(agent_index)}
                            agent_info['content'] = content_list = []

                            content_list.append({'k': '话机号码', 'v': agent.get('agent')})
                            content_list.append({'k': '结果', 'v': decode_agent(agent.get('result'))})
                            content_list.append({'k': '时间', 'v': str(agent.get('tsp'))})
                            detail_list.append(agent_info)
                            agent_index += 1

            self.finish(json.dumps({'up_detail': detail_list}))

        except Exception:
            request_log.exception('QUERY CHAIN')
            self.send_error(500)

        finally:
            http_client.close()


# 手动置成功失败
class ManualFixHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):
        args = self.json_args
        user_id = self.current_user['partner_id']
        order_id = args['order_id']
        result_code = args['result_code']
        notes = args['notes']
        operator_id = self.current_user['id']
        cur_time = datetime.datetime.now()
        # op_id = args['op_id']

        # 将修改记录存到db
        session = self.session('purus')

        try:
            op = Operation(order_id=order_id, result_code=result_code, notes=notes, operator_id=operator_id,
                           create_time=cur_time)
            session.add(op)
            session.commit()

        except Exception as e:
            request_log.exception('Insert db error: %s' % str(e))
            session.rollback()
            self.send_error(500)
            return

        finally:
            session.close()

        # 调用maderia 接口回调处理结果
        param = json.dumps({'order_id': order_id, 'result_code': result_code})
        # AES加密 输出base64串
        key = self.application.config['downstream'][user_id].get('pass')
        iv = self.application.config['downstream'][user_id].get('iv')
        code = aes_encode(param, key, iv)
        # post maderia 参数
        made_args = {'user_id': user_id, 'code': code.decode()}

        service_url = self.application.config['downstream'][user_id]['shard']
        url = 'http://%s/callback/manual' % service_url

        http_client = AsyncHTTPClient()

        try:
            request = HTTPRequest(url=url, body=json.dumps(made_args), method='POST', request_timeout=120)
            resp = yield http_client.fetch(request)

            if resp.code == 200:
                body = resp.body.decode()

                if body == 'success':
                    self.finish(json.dumps({'status': 'ok', 'msg': '操作成功'}))
                else:
                    self.finish(json.dumps({'status': 'fail', 'msg': '操作失败'}))

        except Exception:
            request_log.exception('Manual Maderia ERROR')
            self.send_error(500)
            return
        finally:
            http_client.close()


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
            name2 = name1 + ':' + order.get('scope')

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

    elif order.get('product') == 'sinopec':
        return '中石化{price}元直冲'.format(price=order.get('price'))

    else:
        return '{area}{carrier_name}{price}元直冲'.format(
            area=area_name,
            carrier_name=carrier_name,
            price=order.get('price'))


def decode_status(order):
    if order.get('product') == 'data':
        if order.get('back_result') is None and order.get('result') == '00000':
            return '充值中'
        else:
            return escape_data_result(order.get('back_result') or order.get('result'))
    else:
        return escape_fee_result(order.get('back_result') or order.get('result'))


def decode_agent(key):
    return {'1': '手动成功',
            '9': '手动失败',
            '100': '操作成功',
            '101': '操作成功',
            '102': '操作成功',
            '901': '充值卡密码有误',
            '902': '充值卡已失效',
            '903': '您好，您的输入有误，再见',
            '904': '您好，目前暂不能充值',
            '905': '输入超时',
            '906': '您好操作失败再见',
            '907': '手机号码有误',
            '908': '不能为该用户充值',
            '909': '其他服务请按1',
            '910': '充值失败，咨询10086',
            '000': '请稍后',
            '991': '通话一接通就挂掉',
            '992': '通话时间过长',
            '993': '输完卡密之前 电话被挂断',
            '994': '输完卡密之后 电话被挂断 无法得到结果',
            '995': '订单超时',
            '900': '未知状态'
            }.get(key) or '失败(%s)' % key


class OrderAdapter:
    def __init__(self, product, dict):
        self.product = product
        self.price = dict.get('price')
        self.scope = dict.get('scope')
        self.result = dict.get('result')
        self.back_result = dict.get('back_result')


def aes_encode(s, key, iv):
    chiper = AES.new(key, AES.MODE_CBC, iv)
    encode_str = chiper.encrypt(pad(s))
    base_str = base64.b64encode(encode_str)
    return base_str


def pad(s):
    return s + (16 - len(s) % 16) * chr(16 - len(s) % 16)


@tornado.gen.coroutine
def get_route(url):
    http_client = AsyncHTTPClient()

    try:
        request = HTTPRequest(url=url, method='GET', request_timeout=120)
        response = yield http_client.fetch(request)
        if response.code == 200:
            body = response.body.decode()
            return json.loads(body)

    except Exception:
        request_log.exception('QUERY Maderia CHAIN')

    finally:
        http_client.close()
