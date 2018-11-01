import base64
import json
import logging
import math
import datetime
from Crypto.Cipher import AES

import pymongo
import tornado
from tornado.httpclient import AsyncHTTPClient
import tornado.web
import tornado.gen

from handler import JsonHandler2
from utils.escape import escape_data_result, escape_sinopec_result, escape_fee_result
from secret import padding

request_log = logging.getLogger("purus.request")


class SinopecOrderQueryHandler(JsonHandler2):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def get(self):
        if 'sinopec-query' not in self.current_user['roles']:
            return self.resp_json_result('fail', '用户权限异常')

        request_log.info("SinopecOrderQueryHandler REQU: {0}".format(self.request.arguments))

        self.product = self.argu_list['product']
        if not self.argu_list['product']:
            return self.resp_json_result('fail', '未知产品')

        self.user_id = self.current_user['partner_id']
        if not self.user_id:
            return self.resp_json_result('fail', '无法获取登录用户信息')

        if not self.requ_type:
            return self.render('query_order.html', order_type=self.product,
                               title=self.application.config['config']['title'])

        elif self.requ_type == 'get_order_type_list':
            yield self.get_order_type_list()
            return

        elif self.requ_type == 'get_query':
            yield self.get_query()
            return

        elif self.requ_type == 'fuel_card_query':
            yield self.fuel_card_query()
            return

        elif self.requ_type == 'get_export':
            yield self.get_export()
            return

        return self.resp_json_result('fail', '未知请求')

    @tornado.gen.coroutine
    def get_order_type_list(self):
        downstream = self.application.config['downstream'][self.user_id]
        user_type = downstream.get('type', None)

        if user_type == 'full-seller':
            return self.resp_json_result('ok', '获取订单类型成功', {'order_list': ['供货订单', '采购订单']})
        elif user_type == 'sinopec-seller':
            return self.resp_json_result('ok', '获取订单类型成功', {'order_list': ['采购订单']})
        elif user_type == 'sinopec-supplier':
            return self.resp_json_result('ok', '获取订单类型成功', {'order_list': ['供货订单', '采购订单']})
        else:
            return self.resp_json_result('fail', '获取订单类型失败')

    @tornado.gen.coroutine
    def fuel_card_query(self):
        page_index = 1
        page_size = 1

        if 'page_index' in self.argu_list and self.argu_list['page_index']:
            page_index = int(self.argu_list['page_index'])

        if 'page_size' in self.argu_list and self.argu_list['page_size']:
            page_size = int(self.argu_list['page_size'])

        db = self.application.glados_client.GLaDOS.order
        filter_dict = dict()
        try:
            if 'order_id' in self.argu_list and self.argu_list['order_id']:
                filter_dict['_id'] = self.argu_list['order_id']

            if 'account' in self.argu_list and self.argu_list['account']:
                filter_dict['mobile'] = self.argu_list['account']

            if 'card_id' in self.argu_list and self.argu_list['card_id']:
                filter_dict['forrestal_order.card_id'] = self.argu_list['card_id']

            if 'price' in self.argu_list and self.argu_list['price']:
                filter_dict['price'] = int(self.argu_list['price'])

            if 'task_id' in self.argu_list and self.argu_list['task_id']:
                filter_dict['fuel_card_task_id'] = self.argu_list['task_id']

            if 'user_id' in self.argu_list and self.argu_list['user_id']:
                filter_dict['user_id'] = self.argu_list['user_id']

            if 'admin' not in self.current_user['roles']:
                filter_dict['user_id'] = self.user_id

            if 'start' in self.argu_list and 'end' in self.argu_list and self.argu_list['start'] and self.argu_list[
                'end']:
                start = datetime.datetime.strptime(self.argu_list['start'], '%Y/%m/%d %H:%M:%S')
                end = datetime.datetime.strptime(self.argu_list['end'], '%Y/%m/%d %H:%M:%S')
                filter_dict['req_time'] = {'$gte': start, '$lte': end}

            if 'result' in self.argu_list and self.argu_list['result']:
                if self.argu_list['result'] == '1':
                    filter_dict['back_result'] = '1'
                elif self.argu_list['result'] == '0':
                    filter_dict['$and'] = [{'result': '0'}, {'back_result': None}]
                elif self.argu_list['result'] == '9':
                    filter_dict['$or'] = [{'$and': [{'back_result': None}, {'result': {'$ne': '0'}}]},
                                          {'$and': [{'back_result': {'$ne': None}},
                                                    {'back_result': {'$ne': '0'}},
                                                    {'back_result': {'$ne': '1'}}]}]
                elif self.argu_list['result'] == '-1':
                    filter_dict['$and'] = [{'result': '0'}, {'back_result': None}, {'forrestal_order.status': 'unknown'}]

            request_log.info('QUERY DATA {0}'.format(filter_dict))

            count = yield db.find(filter_dict).count()
            max_page = int(math.ceil(count / page_size))
            cursor = db.find(filter_dict).sort([('req_time', pymongo.DESCENDING)]).skip(
                (page_index - 1) * page_size).limit(page_size)

            order_list = []
            while (yield cursor.fetch_next):
                order = cursor.next_object()
                result_code = order.get('back_result') or order.get('result')
                if result_code == '0' and order.get('forrestal_order',{}).get('status') == 'unknown':
                    result_code = '-1'

                update_time = None

                if order.get('forrestal_order', {}).get('status_time'):
                    update_time = order.get('forrestal_order', {}).get('status_time')

                if order.get('back_time'):
                    update_time = order.get('back_time')

                o = {
                    'user_id': order.get('user_id'),
                    'order_id': order.get('_id'),
                    'account': order.get('mobile'),
                    'price': order.get('price'),
                    'create': str(order.get('req_time')),
                    'update': str(update_time or ''),
                    'status': escape_sinopec_result(result_code),

                    'card_id': order.get('forrestal_order',{}).get('card_id'),
                    'account_price': order.get('forrestal_order',{}).get('account_price'),
                    'bot_account': order.get('forrestal_order',{}).get('bot_account'),
                    'err_data': order.get('forrestal_order',{}).get('site_msg')
                }

                order_list.append(o)

        except Exception:
            request_log.exception('QUERY MONGO ERROR')
            self.send_error(500)
            return

        page_info = {'page_index': page_index, 'max_page': max_page}
        return self.resp_json_result('ok', '查询成功', {
            'order_list': order_list,
            'page_info': page_info,
        })

    @tornado.gen.coroutine
    def get_query(self):
        page = int(self.argu_list['page'])
        size = int(self.argu_list['size'])

        order_type = None
        withdraw_id = None
        user_id = None

        if 'order_type' in self.argu_list and self.argu_list['order_type']:
            order_type = self.argu_list['order_type']

        if 'withdraw_id' in self.argu_list and self.argu_list['withdraw_id']:
            withdraw_id = self.argu_list['withdraw_id']

        if 'user_id' in self.argu_list and self.argu_list['user_id']:
            user_id = self.argu_list['user_id']

        if not order_type:
            return self.resp_json_result('fail', '查询订单类型失败')

        if 'admin' not in self.current_user['roles']:
            user_id = self.user_id

        db = self.application.glados_client.GLaDOS.order
        filter_dict = dict()
        try:
            filter_dict['product'] = self.product

            if not withdraw_id:

                if 'order_id' in self.argu_list and self.argu_list['order_id']:
                    filter_dict['_id'] = self.argu_list['order_id']

                if 'mobile' in self.argu_list and self.argu_list['mobile']:
                    filter_dict['mobile'] = self.argu_list['mobile']

                if 'area' in self.argu_list and self.argu_list['area']:
                    filter_dict['area'] = self.argu_list['area']

                if 'price' in self.argu_list and self.argu_list['price']:
                    filter_dict['price'] = int(self.argu_list['price'])

                if 'start' in self.argu_list and 'end' in self.argu_list and self.argu_list['start'] and self.argu_list[
                    'end']:
                    start = datetime.datetime.strptime(self.argu_list['start'], '%Y/%m/%d %H:%M:%S')
                    end = datetime.datetime.strptime(self.argu_list['end'], '%Y/%m/%d %H:%M:%S')
                    filter_dict['req_time'] = {'$gte': start, '$lte': end}

                if 'result' in self.argu_list and self.argu_list['result']:
                    if self.product == 'fee':
                        if self.argu_list['result'] == '-1':
                            filter_dict['$and'] = [{'result': '0'}, {'back_result': None}]
                        else:
                            filter_dict['$or'] = [{'back_result': self.argu_list['result']},
                                                  {'result': self.argu_list['result']}]
                    elif self.product == 'data' or self.product == 'sinopec':
                        if self.argu_list['result'] == 'finish':
                            filter_dict['$or'] = [{'back_result': '00000'}, {'back_result': '0'}, {'back_result': '1'}]
                        elif self.argu_list['result'] == 'processing':
                            filter_dict['$or'] = [{'$and': [{'result': '00000'}, {'back_result': None}]},
                                                  {'$and': [{'result': '0'}, {'back_result': None}]}]
                        elif self.argu_list['result'] == 'fail':
                            filter_dict['$or'] = [{'$and': [{'back_result': None}, {'result': {'$ne': '00000'}}]},
                                                  {'$and': [{'back_result': None}, {'result': {'$ne': '0'}}]},
                                                  {'$and': [{'back_result': {'$ne': None}},
                                                            {'back_result': {'$ne': '00000'}},
                                                            {'back_result': {'$ne': '0'}},
                                                            {'back_result': {'$ne': '1'}}]}]

                if 'admin' not in self.current_user['roles']:

                    # 供货订单
                    if order_type == 'supply_order':
                        filter_dict['truman_order.user_id'] = self.user_id

                    # 采购订单
                    elif order_type == 'sell_order':
                        filter_dict['user_id'] = self.user_id

                elif user_id and user_id != '000000':

                    # 供货订单
                    if order_type == 'supply_order':
                        filter_dict['truman_order.user_id'] = user_id

                    # 采购订单
                    elif order_type == 'sell_order':
                        filter_dict['user_id'] = user_id

                elif user_id == '000000':
                    # 供货订单
                    if order_type == 'supply_order':
                        filter_dict['truman_order'] = {'$ne': None}

                    # 采购订单
                    elif order_type == 'sell_order':
                        pass

                else:
                    request_log.info('Unable to get current user - {0}'.format(user_id))
                    return self.resp_json_result('fail', '无法获取当前用户')

            else:
                filter_dict['truman_order.withdraw_id'] = withdraw_id
                if user_id:
                    filter_dict['user_id'] = user_id

            request_log.info('QUERY DATA {0}'.format(filter_dict))
            count = yield db.find(filter_dict).count()
            max_page = int(math.ceil(count / int(self.argu_list['size'])))
            cursor = db.find(filter_dict).sort([('req_time', pymongo.DESCENDING)]).skip((page - 1) * size).limit(size)

            result = []
            while (yield cursor.fetch_next):
                order = cursor.next_object()

                o = {
                    'order_id': order['_id'],
                    'mobile': order['mobile'],
                    'product': order['product'],
                    'price': order['price'],
                    'area': order['area'],
                    'value': order['value'],
                    'req_time': str(order['req_time']),
                    'result': self.decode_status(order),
                    'back_time': str(order['back_time']),
                    'balance': order['balance'],
                    'order_type': order_type
                }

                result.append(o)

        except Exception:
            request_log.exception('QUERY MONGO ERROR')
            self.send_error(500)
            return

        return self.resp_json_result('ok', '查询成功', {
            'data': result,
            'max': max_page,
            'page': page,
            'size': size
        })

    @staticmethod
    def decode_status(order):
        if order['product'] == 'data':
            if order['back_result'] is None and order['result'] == '00000':
                return '充值中'
            else:
                return escape_data_result(order['back_result'] or order['result'])
        elif order['product'] == 'sinopec':
            return escape_sinopec_result(order['back_result'] or order['result'])
        else:
            return escape_fee_result(order['back_result'] or order['result'])

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def get_export(self):
        args = dict()
        user_id = self.current_user['partner_id']

        args['mail'] = self.argu_list.get('mail')
        args['type'] = self.argu_list.get('type')
        args['user_id'] = self.argu_list.get('user_id')

        if 'admin' not in self.current_user['roles']:
            args['user_id'] = user_id

        if not args.get('criteria'):
            args['criteria'] = {}
            args['criteria']['product'] = self.product
            args['criteria']['start'] = self.argu_list.get('start')
            args['criteria']['end'] = self.argu_list.get('end')
            args['criteria']['result'] = self.argu_list.get('result')
            args['criteria']['price'] = self.argu_list.get('price')
            args['criteria']['area'] = self.argu_list.get('area')
            args['criteria']['order_type'] = self.argu_list.get('order_type')

        else:
            request_log.info('UNKNOWN KEY CRITERIA')

        body = json.dumps(args)
        request_log.info('EXPORT DATA {0}'.format(body))
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
