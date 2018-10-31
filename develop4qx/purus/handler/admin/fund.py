# -*- coding: utf8 -*-
import hashlib
import json
import logging
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from datetime import datetime

from handler import JsonHandler

request_log = logging.getLogger("purus.request")


def signature(part):
    m = hashlib.md5()
    m.update(part.encode('utf8'))
    return m.hexdigest().upper()


class AdminFundHandler(JsonHandler):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        if path is None:
            if 'admin-point' not in self.current_user['roles']:
                return self.redirect('/auth/login')

            downstream = self.application.config['downstream']

            user_list = [{'id': k, 'name': downstream[k]['name'],
                          'tags': downstream[k].get('tags', '')} for k in downstream]

            user_list = sorted(user_list, key=lambda user: int(user['id']))

            self.render('admin_fund.html', user_list=user_list, title=self.application.title)

        elif path == '/order':
            try:
                order_id = self.get_query_argument('order_id')
                user_id = self.get_query_argument('user_id')
            except tornado.web.MissingArgumentError:
                return self.finish(json.dumps({'status': 'fail'}))

            try:
                order_coll = self.application.glados_client.GLaDOS.order

                order = yield order_coll.find_one({'_id': order_id, 'user_id': user_id})

                if order:
                    self.finish(json.dumps({
                        'status': 'ok',
                        'order_id': order['_id'],
                        'back_result': order['back_result'],
                        'value': order['value']}))
                else:
                    return self.finish(json.dumps({'status': 'fail'}))

            except Exception as e:
                print(e)
                return self.finish(json.dumps({'status': 'fail'}))

    @gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        if 'admin-point' not in self.current_user['roles']:
            self.finish()
            return

        user_id = self.json_args['user_id']
        _type = self.json_args['type']
        operator = self.json_args['operator']
        token = self.json_args['token']
        income = self.json_args['income']
        notes = self.json_args['notes']

        if _type == 'refund-manual':
            order_id = self.json_args['order_id']

            try:
                request_log.info('CHECK REFUND ORDER %s', order_id)

                order_coll = self.application.glados_client.GLaDOS.order
                order = yield order_coll.find_one({'_id': order_id})

                if order is None:
                    raise RuntimeError('无法查询订单')

                if order['user_id'] != user_id:
                    raise RuntimeError('您查询的订单与选择的用户不一致，请核实。')

                if order['value'] != int(float(income) * 10000):
                    # print(int(float(income) * 10000))
                    # print(order.value)
                    raise RuntimeError('订单金额异常')

                if order['back_result'] not in ['1', '00000']:
                    raise RuntimeError('订单状态不是正常完成状态')

                t = datetime.strptime(order_id[1:9], '%Y%m%d')
                request_log.info('CHECK REFUND FROM %s', str(t))

                trans_coll = self.application.glados_client.GLaDOS.transaction
                cursor = trans_coll.find({
                    'order_id': order_id, 'user_id': user_id, 'type': 'refund-manual',
                    'create_time': {'$gt': t}})

                refund_trans = yield cursor.to_list(10)

                if refund_trans:
                    return self.finish(json.dumps({'status': 'fail', 'msg': '该订单已经存在手工退款，请核实！'}))

                request_log.info('CHECK REFUND ORDER %s DONE', order_id)

            except RuntimeError as re:
                return self.finish(json.dumps({'status': 'fail', 'msg': str(re)}))
            except Exception as e:
                request_log.exception('FUND FAIL')
                return self.finish(json.dumps({'status': 'fail'}))

        else:
            order_id = ''

        sign0 = signature('{user_id}{order_id}{income}{operator}{token}'.format(
            user_id=user_id,
            order_id=order_id,
            income=income,
            operator=operator,
            token=token))

        body = json.dumps({'type': _type,
                           'order_id': order_id,
                           'user_id': user_id,
                           'income': income,
                           'operator': operator,
                           'token': token,
                           'notes': notes,
                           'sign': sign0})

        http_client = AsyncHTTPClient()
        try:
            downstream = self.application.config['downstream'][user_id]
            url = downstream['shard']

            msg = {'status': 'fail'}
            request = HTTPRequest(url="http://%s/admin/fund" % url,
                                  method='POST', body=body,
                                  headers={'Content-Type': 'application/json'})
            response = yield http_client.fetch(request)
            if response.code == 200:
                request_log.info(response.body)
                msg = json.loads(response.body.decode('utf8'))

                if msg['status'] == 'ok':
                    msg = {
                        'status': 'ok',
                        'msg': '财务操作成功，用户当前余额为' + str(int(msg['msg']) / 10000)
                    }

        except Exception as e:
            request_log.exception('FUND FAIL2')
            msg = {'status': 'fail', 'msg': str(e)}
        finally:
            http_client.close()

        self.finish(json.dumps(msg))
