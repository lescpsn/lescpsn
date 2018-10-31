import json
import logging
import tornado.gen
import tornado.web
from datetime import datetime
from tornado.httpclient import AsyncHTTPClient

from handler import JsonHandler

__author__ = 'Kevin'

request_log = logging.getLogger("purus.request")


class ApiManualCallbackHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        if path == 'filter':
            yield self.post_filter()

        elif path == 'send':
            yield self.post_send()

        else:
            self.send_error(404)

    @tornado.gen.coroutine
    def post_filter(self):

        def add_to_list(order, order_list):
            if order is None:
                return

            status = None
            if order['result'] in ['1', '00000'] and order['back_result'] == '1':
                status = 'finish'
            elif order['result'] in ['1', '00000'] and order['back_result'] is not None:
                status = 'fail'
            elif order['result'] is not None and order['result'] not in ['1', '00000']:
                status = 'fail'

            if status is None:
                return

            order_list.append({
                'id': order['_id'],
                'user_id': order['user_id'],
                'sp_order_id': order['sp_order_id'],
                'mobile': order['mobile'],
                'price': order['price'],
                'area': order['area'],
                'result': '%s(%s/%s)' % (status, order.get('result'), order.get('back_result'))
            })

        order_list = []
        order_coll = self.application.glados_client.GLaDOS.order

        id_list = self.json_args.get('id_list')
        start = self.json_args.get('start')
        end = self.json_args.get('end')
        user_id = self.json_args.get('user_id')
        carrier = self.json_args.get('carrier')
        area = self.json_args.get('area')

        f = {}
        if start and end:
            start = datetime.strptime(start, '%Y/%m/%d %H:%M:%S')
            end = datetime.strptime(end, '%Y/%m/%d %H:%M:%S')
            f['req_time'] = {'$gte': start, '$lt': end}

        if user_id:
            f['user_id'] = user_id

        if carrier and area:
            f['area'] = carrier + ':' + area

        if id_list and user_id:
            # filter by id_list
            for xid in id_list.split('\n'):
                if len(xid) == 23 and xid[0] == 'Q':
                    order = yield order_coll.find_one({'_id': xid})
                    add_to_list(order, order_list)

                elif len(xid) == 11 and xid[0] == '1':
                    q = f.copy()
                    q['mobile'] = xid
                    for order in (yield order_coll.find(q).to_list(10)):
                        add_to_list(order, order_list)
                else:
                    q = f.copy()
                    q['sp_order_id'] = xid
                    for order in (yield order_coll.find(q).to_list(10)):
                        add_to_list(order, order_list)

        else:
            # Just filter by condition
            cursor = order_coll.find(f).limit(400)
            while (yield cursor.fetch_next):
                order = cursor.next_object()
                add_to_list(order, order_list)

        self.finish(json.dumps({'status': 'ok', 'data': order_list}))

    @tornado.gen.coroutine
    def post_send(self):
        # user_id = self.current_user['partner_id']

        order_id = self.json_args.get('order_id')

        order_coll = self.application.glados_client.GLaDOS.order

        order = yield order_coll.find_one({'_id': order_id})

        if order is None:
            return self.finish({'status': 'fail', 'msg:': 'Cannot found order_id'})

        user_id = order['user_id']
        product = order['product']
        carrier, area = order['area'].split(':')
        scope = order['scope'] and ':' + order['scope'] or ''
        price = order['price']

        # offer_id
        k1 = 'product:{user_id}:{product}:{carrier}:{area}:{price}{scope}'.format(
            user_id=user_id,
            product=product,
            carrier=carrier,
            area=area,
            price=price,
            scope=scope)

        offer_id = self.slave.hget(k1, 'offer')
        if offer_id is None:
            k2 = 'product:{user_id}:{product}:{carrier}:{area}:{price}{scope}'.format(
                user_id=user_id,
                product=product,
                carrier=carrier,
                area='CN',
                price=price,
                scope=scope)
            offer_id = self.slave.hget(k2, 'offer')

        if offer_id is None:
            request_log.info('CANNOT FOUND OFFER %s %s', k1, k2)
            return self.finish({'status': 'fail', 'msg:': 'Cannot found offer'})

        back_result = order.get('back_result')
        result = order.get('result')

        status = None
        if result in ['1', '00000'] and back_result == '1':
            status = 'finish'
        elif result in ['1', '00000'] and back_result is not None:
            status = 'fail'
        elif result is not None and result not in ['1', '00000']:
            status = 'fail'

        if status is None:
            return self.finish({'status': 'fail', 'msg:': 'order in processing'})

        request_log.info('STATUS %s %s %s', str(order), offer_id, status)

        sp_order_id = order['sp_order_id']
        mobile = order['mobile']
        back_time = order['back_time']

        data = {
            'order_id': sp_order_id,
            'transactionid': order_id,
            'orderstatus': status,
            'result_code': back_result or result,
            'plat_offer_id': offer_id,
            'facevalue': price,
            'phone_id': mobile,
            'ordertime': back_time.strftime("%Y-%m-%d %H:%M:%S")
        }

        http_client = AsyncHTTPClient()
        base_url = self.application.config['connection']['repo']
        try:
            url = base_url + '/api/user/by_id'
            body = json.dumps({'user_id': user_id})

            response = yield http_client.fetch(url, method='POST', body=body)
            resp = response.body.decode()

            user = json.loads(resp)
            request_log.info("curl -d '%s' %s", json.dumps(data), user['data']['back_url'])

            self.finish(json.dumps({'status': 'ok', 'data': data}))

        except Exception:
            request_log.exception('GET USER FAIL')
            self.finish(json.dumps({'status': 'fail'}))

        finally:
            http_client.close()
