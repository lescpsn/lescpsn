import json
import logging
import tornado.gen
from tornado.httpclient import AsyncHTTPClient

from handler import JsonHandler

request_log = logging.getLogger('purus.request')


class ApiProductHandler(JsonHandler):
    @tornado.gen.coroutine
    def get(self, path):
        http_client = AsyncHTTPClient()

        if path == 'level':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/product/list_level?domain_id=' + self.current_user['domain_id']

                response = yield http_client.fetch(url, method='GET')
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()          
        else:
            self.send_error(404)

    @tornado.gen.coroutine
    def post(self, path):
        if 'admin-product' not in self.current_user['roles']:
            self.send_error(403)
            return

        http_client = AsyncHTTPClient()

        if path == 'list':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/product/list'

                curr_domain = self.current_user['domain_id']
                domain_id = self.json_args.get('domain_id')

                if domain_id:
                    if domain_id != curr_domain:
                        self.json_args['up_domain_id'] = curr_domain
                else:
                    domain_id = curr_domain
                
                self.json_args['domain_id'] = domain_id

                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})
            finally:
                http_client.close()

        elif path == 'update':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/product/update'

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})

        elif path == 'set_level':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/product/set_level'

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})

        elif path == 'sync':
            try:
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/product/sync'

                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            except Exception as e:
                self.finish({'status': 'fail', 'msg': 'FAIL'})

        else:
            self.send_error(404)
