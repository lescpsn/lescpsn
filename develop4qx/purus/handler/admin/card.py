# -*- coding: utf8 -*-
import hashlib
import json
import logging

from tornado import gen
from tornado.httpclient import AsyncHTTPClient
import tornado.ioloop
import tornado.httpserver
import tornado.web

from db.machado import get_card_order_shard, get_card_up_order_shard
from handler import JsonHandler
from utils.escape import escape_area


request_log = logging.getLogger("purus.request")


def signature(part):
    m = hashlib.md5()
    m.update(part.encode('utf8'))
    return m.hexdigest().upper()


RESULT_MAP = {
    '-1': '未被处理',
    '0': '充值成功',
    '900': '充值等待',
    '901': '卡失效，请人工核实',
    '902': '卡密错误，请人工核实',
    '903': '不能为手机号码充值，请人工核实',
    '904': '手机号码不存在',
    '905': '手机号码输入有误',
    '906': '未知状态，请人工核实',
    '907': '充值失败',
    '908': '未充值',
}


class AdminCardHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self, path):
        if 'admin-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        self.render('admin_card.html', title=self.application.title)


    @gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        if 'admin-card' not in self.current_user['roles']:
            self.finish()
            return

        cfg = self.application.config['machado']
        url = cfg['url']

        if path == '/unknown':
            http_client = AsyncHTTPClient()
            try:
                full_url = '%s/admin/query/unknown' % url
                response = yield http_client.fetch(full_url, method='GET')
                body = response.body.decode()
                info = json.loads(body)

                for order in info:
                    # result info
                    for card in order['cards']:
                        card['s'] = RESULT_MAP.get(card['r'], card['r'])
                    # area
                    num = int(int(order['number']) / 10000)
                    o, a = self.application.classifier.search(num)
                    order['area'] = escape_area(a)

                self.finish(json.dumps({'status': 'ok', 'order': info}))
            except:
                request_log.exception('QUERY UNKNOWN')
                self.finish({'status': 'fail'})
            finally:
                http_client.close()

        elif path == '/single':
            order_id = self.json_args['order_id']

            http_client = AsyncHTTPClient()
            try:
                full_url = '%s/admin/query/single?order_id=%s' % (url, order_id)

                response = yield http_client.fetch(full_url, method='GET')
                body = response.body.decode()
                info = json.loads(body)

                # from db
                if info is None:
                    session = self.session('madeira')

                    try:
                        card_order_cls = get_card_order_shard('100001')
                        card_order = session.query(card_order_cls).filter(card_order_cls.order_id == order_id).first()

                        if card_order:
                            info = {'number': card_order.mobile, 'cards': []}

                            card_up_order_cls = get_card_up_order_shard('100001')
                            parse = 0
                            for up_order in session.query(card_up_order_cls).filter(
                                            card_up_order_cls.order_id == order_id).all():
                                card_id = up_order.card_id
                                result = up_order.up_back_result

                                info['cards'].append({'id': card_id, 'r': result})
                                parse += 1

                    finally:
                        session.close()

                if info:
                    for card in info['cards']:
                        card['s'] = RESULT_MAP.get(card['r'], card['r'])

                    self.finish(json.dumps({'status': 'ok', 'order': info}))
                else:
                    self.finish({'status': 'fail'})
            except Exception as e:
                print(e)
                self.finish({'status': 'fail'})
            finally:
                http_client.close()

        elif path == '/callback':
            order_id = self.json_args['order_id']
            back_result = self.json_args['back_result']

            http_client = AsyncHTTPClient()

            try:
                body = ('client_bill_id={order_id}'
                        '&bill_id=MACHADO'
                        '&bill_time='
                        '&bill_crdno='
                        '&bill_usrid='
                        '&bill_amount=0'
                        '&charge_state={back_result}'
                        '&charge_note='
                        '&charge_time=0'
                        '&charge_time_consuming=0'
                        '&settleup_amount=0'
                        '&charge_count=0'
                        '&sign='
                        '&inner=true').format(
                    order_id=order_id,
                    back_result=back_result)

                full_url = '%s/callback/spc.do' % url
                response = yield http_client.fetch(full_url, method='POST', body=body)

                if response.code == 200:
                    resp = response.body.decode('utf8')
                    self.finish(json.dumps({'status': 'ok', 'msg': '回调成功'}))

            except Exception as e:
                self.finish(json.dumps({'status': 'fail', 'msg': repr(e)}))
            finally:
                http_client.close()

        else:
            self.finish('')