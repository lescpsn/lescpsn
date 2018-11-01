# -*- coding: utf8 -*-
import logging
import math
import json
import datetime
from handler import JsonHandler
import pymongo

PRODUCT_LIST = ['fee', 'data', 'sinopec']

request_log = logging.getLogger("purus.request")


class OrderMongoQueryHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)
        #self.mongo = pymongo.MongoClient(self.application.config['mongodb']['GLaDOS'])

    def post(self, product):
        #### SAFTY ######
        safety = self.application.config.get('safety')
        if safety is None:
            request_log.error('CONFIG FAIL (NO SAFETY)')
            return self.send_error(500)

        # verify ip in white list
        if self.request.remote_ip not in safety['white_list']:
            request_log.error("CONFIG FAIL ('%s'NOT IN WHITELIST)", self.request.remote_ip)
            return self.send_error(500)
        #### SAFTY ######

        if product not in PRODUCT_LIST:
            return self.finish()

        args = self.json_args

        page = int(args['page'])
        size = int(args['size'])

        #user_id = args['user_id']

        try:
            # find
            f = False
            #db = self.mongo.GLaDOS.order
            db = self.application.mongo1.GLaDOS.order
            filter_dict = {}
            filter_dict['product'] = product
            #filter_dict['user_id'] = user_id

            if 'number' in args and args['number']:
                filter_dict['mobile'] = args['number']
                f = True
            if 'start' in args and 'end' in args and args['start'] and args['end']:
                start = datetime.datetime.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
                end = datetime.datetime.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
                filter_dict['req_time'] = {'$gte': start, '$lte': end}
                f = True
            if 'result' in args and args['result']:
                if product == 'fee' or product == 'sinopec':
                    if args['result'] == '-1':
                        filter_dict['$and'] = [{'result': '0'}, {'back_result': None}]
                    else:
                        filter_dict['$or'] = [{'back_result': args['result']}, {'result': args['result']}]
                elif product == 'data':
                    if args['result'] == 'finish':
                        filter_dict['$or'] = [{'back_result': '00000'}, {'back_result': '1'}]
                    elif args['result'] == 'processing':
                        filter_dict['$and'] = [{'result': '00000'}, {'back_result': None}]
                    elif args['result'] == 'fail':
                        filter_dict['$or'] = [{'$and': [{'back_result': None}, {'result': {'$ne': '00000'}}]},
                                              {'$and': [{'back_result': {'$ne': None}},
                                                        {'back_result': {'$ne': '00000'}},
                                                        {'back_result': {'$ne': '1'}}]}]
                f = True
            if 'id' in args and args['id']:
                filter_dict['_id'] = args['id']
                f = True
            if 'sp_id' in args and args['sp_id']:
                filter_dict['sp_order_id'] = args['sp_id']
                f = True
            if 'carrier' in args and args['carrier']:
                if 'area' in args and args['area']:
                    filter_dict['area'] = '%s:%s' % (args['carrier'], args['area'])
                else:
                    filter_dict['area'] = {'$regex': ('^' + args['carrier'] + ':.{2}')}
                f = True
            else:
                if 'area' in args and args['area']:
                    filter_dict['area'] = {'$regex': ('.:' + args['area'] + '$')}
                f = True
            if not f and not (page == 1 and size <= 10):
                return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))
            count = db.find(filter_dict).count()
            max_page = int(math.ceil(count / int(args['size'])))
            orders = db.find(filter_dict) \
                .sort([('req_time', pymongo.DESCENDING)]) \
                .skip((page - 1) * size) \
                .limit(size)
            result = []
            if orders:
                for order in orders:
                    # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
                    # carrier = ''
                    # carrier_name = ''
                    # area = ''
                    # if order.get('area') and ':' in order.get('area'):
                    #     carrier, area = order['area'].split(':')
                    #     carrier_name = escape_carrier(carrier)
                    #     area_name = escape_area(area)

                    o = {
                        'id': order.get('_id'),
                        'sp_id': order.get('sp_order_id'),
                        'phone': order.get('mobile'),
                        'value': (order.get('value') is not None and '%.3f' % (order.get('value') / 10000)) or '-',
                        'create': str(order.get('req_time')),
                        'update': order.get('back_time') and str(order.get('back_time')),
                        'balance': (order.get('balance') is not None and '%0.03f' % (
                            order.get('balance') / 10000)) or '-',
                        'scope': order.get('scope'),
                        'product': order.get('product'),
                        'result': order.get('result'),
                        'back_result': order.get('back_result'),
                        'price': order.get('price'),
                        'area': order.get('area'),
                        'user_id': order.get('user_id'),
                    }
                    result.append(o)
        except Exception:
            request_log.exception('QUERY MONGO ERROR')
            self.send_error(500)
            return

        finally:
            print('--------------------------------finish---------------------------------------')

        self.write(json.dumps({
            'data': result,
            'max': max_page,
            'page': page,
            'size': size
        }))

