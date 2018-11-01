import json
import logging
import math
from tornado.httpclient import AsyncHTTPClient
from handler import JsonHandler
import tornado.gen

request_log = logging.getLogger('purus.request')


class ApiSpecialHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        if 'admin-customer' not in self.current_user['roles']:
            self.send_error(403)
            return

        http_client = AsyncHTTPClient()

        if path == 'list':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/list'

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)
            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})
            finally:
                http_client.close()

        elif path == 'product':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/product/list?domain_id=' + self.current_user['domain_id']

                response = yield http_client.fetch(url, method='GET')
                self.finish(response.body.decode())

            except Exception as e:
                request_log.exception('LIST PRODUCT FAIL')
                self.finish({'status': 'fail', 'msg': 'FAIL'})

            finally:
                http_client.close()

        elif path == 'supply':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/list_supply'

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)
            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})
            finally:
                http_client.close()

        elif path == 'add' or path == 'update':

            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/' + path

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})
            finally:
                http_client.close()

        elif path == 'batch_update':

            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/' + path

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})
            finally:
                http_client.close()

        elif path == 'delete':

            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/special/delete'

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
