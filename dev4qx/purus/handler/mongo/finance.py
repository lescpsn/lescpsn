# -*- coding: utf8 -*-
import json
import math
import time
import pymongo
import logging
from handler import JsonHandler
from utils.escape import escape_finance_type, escape_carrier, escape_area

request_log = logging.getLogger("purus.request")


class FinanceMongoHandler(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)
        #self.mongo = pymongo.MongoClient(self.application.config['mongodb']['GLaDOS'])

    def post(self):
        args = self.json_args

        page = int(args['page'])
        size = int(args['size'])

        user_id = args['user_id']

        try:
            # find
            #db = self.mongo.GLaDOS.transaction
            db = self.application.mongo1.GLaDOS.transaction
            f = False
            filter_dict = {}
            #filter_dict['user_id'] = user_id
            if args['account']:
                filter_dict['account'] = args['account']
                f = True
            if args['start'] and args['end']:
                import datetime

                start = time.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
                start = datetime.datetime(start.tm_year, start.tm_mon, start.tm_mday, start.tm_hour, start.tm_min)
                end = time.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
                end = datetime.datetime(end.tm_year, end.tm_mon, end.tm_mday, end.tm_hour, end.tm_min)
                filter_dict['create_time'] = {'$gte': start, '$lte': end}
                f = True
            if args['type']:
                filter_dict['type'] = args['type']
                f = True
            if not f:
                return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

            count = db.find(filter_dict).count()
            max_page = int(math.ceil(count / int(args['size'])))
            orders = db.find(filter_dict) \
                .sort([('req_time', pymongo.DESCENDING)]) \
                .skip((page - 1) * size) \
                .limit(size)
            # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
            '''
                id = Column(Integer, primary_key=True)
                trans_id = Column(String)
                type = Column(String)
                income = Column(Integer)
                outcome = Column(Integer)
                balance = Column(Integer)
                order_id = Column(String)
                user_id = Column(String)
                account = Column(String)
                name = Column(String)
                create_time = Column(DateTime)
                notes = Column(String)
            '''
            result = []
            if orders:
                    for order in orders:
                        name = ''
                        if order.get('name'):
                            n = order.get('name').split(':')
                            if len(n) == 4:
                                p = n[0]
                                if p == 'data':
                                    p = '流量'
                                elif p == 'fee':
                                    p = '话费'
                                c = escape_carrier(n[1])
                                a = escape_area(n[2])
                                v = n[3]
                                name = '%s%s%s元%s充值' % (a, c, v, p)

                        o = {
                            'id': order.get('_id'),
                            'type': escape_finance_type(order.get('type')),
                            'value': '%.3f' % ((order.get('income') - order.get('outcome')) / 10000),
                            'balance': '%.3f' % (order.get('balance') / 10000),
                            'order_id': order.get('order_id'),
                            'account': order.get('account'),
                            'time': str(order.get('create_time')),
                            'name': name,
                            'notes': order.get('notes') or '',
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