# -*- coding: utf8 -*-
import base64
import re
import json
import time
from datetime import datetime
import io
import gzip

from Crypto.Cipher import AES
import math
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import tornado.ioloop
import tornado.httpserver
import tornado.web
from db.madeira import get_order_shard

from db.purus import BatchInfo, BatchDetail
from handler import JsonHandler
from secret import padding
from utils.escape import escape_data_result


class BatchChargeHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self, path_args):
        self.render('charge_batch.html', sub=path_args, title=self.application.title)

    @tornado.web.authenticated
    @gen.coroutine
    def post(self, path_args):
        if path_args == '/upload':
            self.post_upload()
        elif path_args == '/query':
            self.post_query()
        elif path_args == '/list':
            self.post_list()
        elif path_args == '/start':
            yield self.post_start()
        else:
            self.write_error(405)

    def post_upload(self):
        ret = {'status': 'fail', 'msg': ''}
        user_id = self.current_user['partner_id']

        try:
            session = self.session('purus')

            f = self.request.files['batch'][0]

            buf = io.StringIO(f['body'].decode('utf-8'))
            l = buf.readline()
            m = re.search('^([A-Za-z0-9]{8,10}),(\d+)$', l.strip())
            if m is None:
                raise RuntimeError('文件头格式不正确')

            batch_id = m.group(1)
            count = int(m.group(2))

            # Save BatchInfo
            batch_info = BatchInfo()
            batch_info.batch_id = batch_id
            batch_info.user_id = user_id

            session.add(batch_info)

            p_cache = dict()
            re_number = re.compile('^(\d{11}),(\d{1,3})$')

            i = 0
            carrier = 3  # default
            for line in buf:
                if line.strip() == '':
                    continue

                m = re_number.search(line.strip())

                if m is None:
                    raise RuntimeError('格式不正确')

                mobile = m.group(1)
                price = m.group(2)

                if price not in p_cache:
                    # product:100001:data:3:0
                    k = 'product:{user_id}:data:{carrier}:{price}'.format(user_id=user_id, carrier=carrier, price=price)
                    offer = self.slave.hget(k, 'offer')

                    if offer is None:
                        raise RuntimeError('不存在面值为%s的产品包' % price)
                    else:
                        p_cache[price] = offer

                batch_detail = BatchDetail()
                batch_detail.batch_id = batch_id
                batch_detail.mobile = mobile
                batch_detail.carrier = carrier
                batch_detail.price = price
                batch_detail.stage = 0
                batch_detail.status = 'create'

                session.add(batch_detail)
                i += 1

            if i != count:
                raise RuntimeError('批量文件中定义的数量与记录数不符')

            session.commit()

            # backup file
            gf = gzip.open(batch_id + '.gz', 'w')
            gf.write(f['body'])
            gf.close()

            ret = {'status': 'ok', 'batchId': batch_id}
            self.finish(json.dumps(ret))

        except Exception as e:
            ret['msg'] = str(e)
            self.finish(json.dumps(ret))
        finally:
            session.close()

    def post_list(self):
        try:
            user_id = self.current_user['partner_id']

            session = self.session('purus')

            info_list = session.query(BatchInfo).filter(
                BatchInfo.user_id == user_id)

            result = []
            for info in info_list.all():
                result.append(info.batch_id)

            return self.finish(json.dumps({'status': 'ok', 'data': result}))

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': e}))
        finally:
            session.close()

    def post_query(self):
        try:
            user_id = self.current_user['partner_id']
            batch_id = self.json_args['batch']
            page = int(self.json_args['page'])
            size = int(self.json_args['size'])
            status = self.json_args['status']

            offset = (page - 1) * size

            session = self.session('purus')
            session_made = self.session('madeira')

            batch_info = session.query(BatchInfo).filter(BatchInfo.batch_id == batch_id).filter(
                BatchInfo.user_id == user_id).first()

            if batch_info is None:
                raise RuntimeError('')

            q = session.query(BatchDetail).filter(BatchDetail.batch_id == batch_id)

            if status and status != '':
                q = q.filter(BatchDetail.status == status)

            count = q.count()
            max_page = int(math.ceil(count / size))

            result = []

            if count > 0:
                details = q.order_by(BatchDetail.id).offset(offset).limit(size)

                for detail in details.all():
                    if detail.status == 'call':
                        order_cls = get_order_shard(user_id)
                        order_id = detail.order_id.split(',')[-1].strip()
                        order = session_made.query(order_cls).filter(order_cls.sp_order_id == order_id).first()

                        if order and order.back_result:
                            if order.back_result == '00000':
                                detail.status = 'success'
                                session.add(detail)
                            elif order.back_result in ['10010', '10058']:
                                detail.status = 'fail'
                                session.add(detail)

                    result.append({
                        'mobile': detail.mobile,
                        'price': detail.price,
                        'status': detail.status,
                        'order_id': detail.order_id,
                    })

            session.commit()

            self.finish(json.dumps({'page': page, 'max': max_page, 'data': result}))
        except Exception as e:
            self.finish(json.dumps({'data': []}))
        finally:
            session.close()
            session_made.close()


    @gen.coroutine
    def post_start(self):
        batch_id = self.json_args['batch_id']
        user_id = self.current_user['partner_id']

        downstream = self.application.config['downstream'][user_id]
        iv = downstream['iv']
        passphrase = downstream['pass']

        try:
            session = self.session('purus')

            batch_info = session.query(BatchInfo).filter(BatchInfo.batch_id == batch_id).filter(
                BatchInfo.user_id == user_id).first()

            if batch_info is None:
                raise RuntimeError('')

            q = session.query(BatchDetail).filter(BatchDetail.batch_id == batch_id).filter(
                BatchDetail.status == 'create')

            count = q.count()

            i = 0
            for detail in q.order_by(BatchDetail.id).limit(20).all():

                mobile = detail.mobile
                if self.master.sismember('batch:' + batch_id, mobile):
                    continue

                key = 'product:{user_id}:data:{carrier}:{price}'.format(
                    user_id=user_id, carrier=detail.carrier, price=detail.price)

                stage = detail.stage + 1

                product = self.slave.hmget(key, ['offer', 'value'])
                if product[0] is None:
                    continue

                id = self.master.incr('uid:batch')

                order_id = '%s%08d%02d' % (batch_id, id, stage)

                code = json.dumps({
                    'request_no': order_id,
                    'contract_id': '100001',
                    'order_id': order_id,
                    'plat_offer_id': product[0],
                    'phone_id': mobile,
                    'facevalue': int(product[1]),
                })

                aes = AES.new(passphrase, AES.MODE_CBC, iv)
                b = aes.encrypt(padding(code))
                encrypted = base64.b64encode(b).decode('utf8')

                body = json.dumps({'partner_no': user_id, 'code': encrypted})

                url = 'http://{shard}/data/order'.format(shard=downstream['shard'])

                http_client = AsyncHTTPClient()
                result = '99999'

                try:
                    request = HTTPRequest(url=url, method='POST', body=body)
                    response = yield http_client.fetch(request)

                    if response.code == 200:
                        resp = json.loads(response.body.decode('utf8'))
                        result = resp['result_code']
                except Exception as e:
                    pass
                finally:
                    http_client.close()

                # update
                if result == '00000':
                    detail.status = 'call'
                    self.master.sadd('batch:' + batch_id, mobile)
                else:
                    detail.status = 'fail'
                detail.stage = stage
                if stage > 1:
                    detail.order_id += ', ' + order_id
                else:
                    detail.order_id = order_id
                session.add(detail)
                session.commit()


        except Exception as e:
            print(e)
            self.finish(json.dumps({'data': []}))



