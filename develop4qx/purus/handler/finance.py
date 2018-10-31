# -*- coding: utf8 -*-
import json
import math
import time
import pymongo
import tornado.ioloop
import tornado.httpserver
import tornado.web
from sqlalchemy import desc
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import logging

from db.madeira import get_trans_shard
from handler import JsonHandler
from utils.escape import escape_finance_type, escape_carrier, escape_area

request_log = logging.getLogger("purus.request")


class FinanceHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self):
        user_list = None
        if 'admin' in self.current_user['roles']:
            downstream = self.application.config['downstream']

            user_list = [{'id': k, 'name': downstream[k]['name'],
                          'tags': downstream[k].get('tags', '')} for k in downstream]
            user_list = sorted(user_list, key=lambda user: int(user['id']))

        self.render('finance.html', user_list=user_list, title=self.application.title)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):

        args = self.json_args
        if 'admin' not in self.current_user['roles'] or 'user_id' not in args:
            args['user_id'] = self.current_user['partner_id']

        if 'admin' in self.current_user['roles'] and args['user_id'] == '':
            http_client = AsyncHTTPClient()

            try:
                url = '%s/finance/mongo' % self.application.config['blocking']['url']

                request = HTTPRequest(url=url, method='POST', body=json.dumps(args), request_timeout=120)
                response = yield http_client.fetch(request)

                if response.code == 200:
                    body = response.body.decode()
                    self.finish(body)
                else:
                    self.send_error(500)
            except Exception:
                request_log.exception('QUERY CHAIN')
                self.send_error(500)

            finally:
                http_client.close()

        elif self.application.config.get('blocking') and self.application.config['blocking'].get('url'):
            http_client = AsyncHTTPClient()

            url = '%s/finance/block' % (self.application.config['blocking']['url'])
            try:
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
        else:
            o = FinanceBlockingHandler(self.application, self.request)
            o.json_args = args
            o.post()
            self._headers = o._headers
            self._status_code = o._status_code
            self._write_buffer = o._write_buffer
            self.finish()


class FinanceBlockingHandler(JsonHandler):
    def post(self):
        args = self.json_args

        page = int(args['page'])
        size = int(args['size'])

        # if 'admin' in self.current_user['roles'] and 'user_id' in args:
        #     user_id = args['user_id']
        # else:
        #     user_id = self.current_user['partner_id']
        user_id = args['user_id']

        session = self.session('madeira')

        result = []

        if 'shard_id' in self.application.config['downstream'][user_id]:
            master_id = self.application.config['downstream'][user_id]['shard_id']
        elif 'master' in self.application.config['downstream'][user_id]:
            master_id = self.application.config['downstream'][user_id]['master']
        else:
            master_id = user_id

        trans_cls = get_trans_shard(master_id)
        q = session.query(trans_cls).filter(trans_cls.user_id == user_id)
        f = False
        # filter
        if args['account']:
            q = q.filter(trans_cls.account == args['account'])
            f = True
        if args['start'] and args['end']:
            start = time.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
            end = time.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
            q = q.filter(trans_cls.create_time >= start) \
                .filter(trans_cls.create_time < end)
            f = True
        # if args['name']:
        # q = q.filter(trans_cls.status == args['name'])
        # f = True
        if args['type']:
            q = q.filter(trans_cls.type == args['type'])
            f = True

        if not f:
            return self.write(json.dumps({'status': 'fail', 'msg': '您未选择任何过滤条件，请至少输入一个'}))

        count = q.count()
        # print(count)

        max_page = int(math.ceil(count / int(args['size'])))

        q = q.order_by(desc(trans_cls.create_time), desc(trans_cls.id)) \
            .offset((page - 1) * size) \
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
        for trans in q:
            name = ''
            if trans.name:
                n = trans.name.split(':')
                if len(n) == 3:
                    c = escape_carrier(n[0])
                    p = escape_area(n[1])
                    v = n[2]
                    name = '%s%s%s元直充' % (p, c, v)

            o = {
                'id': trans.trans_id,
                'type': escape_finance_type(trans.type),
                'value': '%.3f' % ((trans.income - trans.outcome) / 10000),
                'balance': '%.3f' % (trans.balance / 10000),
                'order_id': trans.order_id,
                'account': trans.account,
                'time': str(trans.create_time),
                'name': name,
                'notes': trans.notes or '',
            }
            result.append(o)

        session.close()

        self.write(json.dumps({
            'data': result,
            'max': max_page,
            'page': page,
            'size': size
        }))

############################################mongo#####################################################
