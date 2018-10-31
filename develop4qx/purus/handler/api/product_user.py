import json
import logging
import tornado.gen
import math
from tornado.httpclient import AsyncHTTPClient

from handler import JsonHandler
from utils import escape

request_log = logging.getLogger('purus.request')

PRODUCT_TYPE = {
    'data': '流量',
    'fee': '话费'
}

STATUS = {
    'enabled': '正常',
    'disabled': '维护',
    'n/a': '上游维护',
}


def decode_product(p):
    '''
    copy & decode
    '''
    p1 = p.copy()
    p1['type_n'] = PRODUCT_TYPE.get(p1['type'])
    p1['carrier_n'] = escape.escape_carrier(str(p1['carrier']))
    p1['area_n'] = escape.escape_area(p1['area'])
    p1['use_area_n'] = escape.escape_area(p1['use_area'])
    p1['status_n'] = STATUS.get(p1['status'])

    return p1


class ApiProductUserHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):

        if 'admin-product' not in self.current_user['roles']:
            self.send_error(403)
            return

        http_client = AsyncHTTPClient()
        repo = self.application.repo

        if path == 'list':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/list_product'

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                self.finish(response.body.decode())

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})

            finally:
                http_client.close()

        elif path == 'update':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/update'

                self.json_args['domain_id'] = self.current_user['domain_id']

                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})
            finally:
                http_client.close()


        else:
            self.send_error(404)
