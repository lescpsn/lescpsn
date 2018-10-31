import json
import logging
import time
from urllib.parse import quote
from datetime import datetime as dt
import tornado.web
from sqlalchemy import desc
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from db.purus import OperationLog
from handler import JsonHandler
from utils.encryption_decryption import md5_signature

__author__ = 'xinxin'

request_log = logging.getLogger("purus.request")


class ApiUpstreamHandler(JsonHandler):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        request_log.debug(path)
        if 'services' not in self.current_user['roles']:
            return self.redirect('auth/login')

        if path == 'adjust':
            yield self.adjust()
            return
        if path == 'list_all':
            yield self.list_all()
            return
        if path == 'detail':
            yield self.detail()
            return

        self.send_error(404)

    # 余额充值接口
    @tornado.gen.coroutine
    def adjust(self):
        request_body = self.request.body.decode()
        body = json.loads(request_body)

        upstream_id = body.get("upstream_id")
        operation = body.get("type")
        notes = body.get("notes")
        module_id = "upstream"
        value = body.get("value")
        create_date = dt.now()
        operator_id = self.current_user['id']

        value = int(float(value) * 10000)

        session = self.session('purus')  # 记录操作日志表

        try:
            log = OperationLog()
            log.operator_id = operator_id
            log.operation = operation
            log.module_id = module_id
            log.object = upstream_id
            log.value = value
            log.notes = notes
            log.create_date = create_date

            session.add(log)
            session.commit()

            partner_id = self.current_user['partner_id']  # 调用madeira通用设置接口，增加后数据加入数据库
            shard = self.application.config['downstream'][partner_id]['shard']
            url = 'http://%s/admin/pricing' % shard
            secret = self.application.config['safety'].get('secret')

            request_log.debug('URL %s' % url)

            tsp = str(int(time.mktime(time.localtime())))
            v = md5_signature(tsp + secret)

            if operation == 'adjust':
                body = 'set {key} {value}'.format(key='upstream:' + upstream_id, value=value)
            elif operation == 'deposit':
                body = 'incrby {key} {value}'.format(key='upstream:' + upstream_id, value=value)

            request_log.info('UPSTREAM - %s - %s', operation, body)

            http_client = AsyncHTTPClient()
            response = yield http_client.fetch(
                    HTTPRequest(url=url, method='POST', body=body, headers={'tsp': tsp, 'v': v}, request_timeout=120))
            if response.code == 200:
                response_body = response.body.decode()
                request_log.debug(response_body)

                self.finish({'status': 'ok', 'msg': '保存成功'})
            else:
                self.finish({'status': 'fail', 'msg': '保存失败'})
        except Exception as FALL:
            request_log.exception('FALL')
        finally:
            session.close()

    # 余额列表查询接口
    @tornado.gen.coroutine
    def list_all(self):
        upstream = self.application.config['interface']
        keys = 'upstream:*'
        partner_id = self.current_user['partner_id']
        base_url = self.application.config['downstream'][partner_id]['shard']
        url = 'http://%s/admin/config?keys=%s' % (base_url, quote(keys))

        request_log.info(' URL=%s', url)  # 调用madeira接口，获取value值

        value_map = {}
        try:
            http_client = AsyncHTTPClient()
            response = yield http_client.fetch(url, method='GET', request_timeout=120)

            if response.code == 200:
                response_body = response.body.decode()
                request_log.debug(response_body)
                for line in response_body.split('\n'):
                    request_log.info(line)
                    if ' ' not in line:
                        continue

                    r1, r2 = line.split(' ')
                    upstream_id = r1.split(':')[1]
                    value = float(r2)
                    value_map[upstream_id] = value

        except Exception as e:
            request_log.exception(e)

        session = self.session('purus')  # 从日志表取最后一次价款金额
        try:
            data_list = []
            for upstream_id in upstream:
                last = 0
                db_upstream = session.query(OperationLog).filter(OperationLog.module_id == 'upstream').filter(
                        OperationLog.object == upstream_id).filter(OperationLog.operation == 'deposit').order_by(
                        desc(OperationLog.create_date)).first()
                if db_upstream:
                    last = int(db_upstream.value or 0)

                data_list.append({
                    "upstream_id": upstream_id,
                    "upstream_name": upstream.get(upstream_id),
                    "value": '%.3f' % (value_map.get(upstream_id, 0) / 10000),
                    # "value": value_map.get(upstream_id, 0),
                    "last": '%.3f' % (last / 10000)
                })

            self.finish(json.dumps({'status': 'ok', 'data': sorted(data_list, key=lambda k: k['value'])}))

        except Exception as LIST_ALL:
            self.finish(json.dumps({'status': 'fail', 'msg': str(LIST_ALL)}))
            request_log.exception(LIST_ALL)
        finally:
            session.close()

    # 详情查询接口
    @tornado.gen.coroutine
    def detail(self):
        request_body = self.request.body.decode()
        body = json.loads(request_body)
        upstream_id = body.get("upstream_id")

        session = self.session('purus')  # 根据upstream_id，查询日志列表
        data = []
        try:
            info_list = session.query(OperationLog).filter(OperationLog.object == upstream_id).order_by(
                    desc(OperationLog.id))
            for log in info_list.all():
                data.append({
                    'operator_name': log.operator_id,
                    'value': '%.3f' % (float(log.value) / 10000),
                    'type': log.operation,
                    'notes': log.notes,
                    'create_date': str(log.create_date),
                })

            self.finish(json.dumps({'data': data, 'status': "ok"}))

        except Exception as DETAIL:
            self.finish(json.dumps({'status': 'fail', 'msg': str(DETAIL)}))
            request_log.exception(DETAIL)
        finally:
            session.close()
