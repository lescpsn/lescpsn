import json
import logging
import tornado.gen
import tornado.web
from tornado.httpclient import AsyncHTTPClient

from handler import BaseHandler

__author__ = 'Kevin'

request_log = logging.getLogger("purus.request")


class ApiUserHandler(BaseHandler):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def get(self, path):

        http_client = AsyncHTTPClient()

        if path == 'list':
            if 'admin' not in self.current_user['roles']:
                self.send_error(403)
                return

            try:

                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/user/list?domain_id=' + self.current_user['domain_id']

                request_log.info('GET USER %s', url)

                response = yield http_client.fetch(url, method='GET')
                resp = response.body.decode()
                self.finish(resp)

            except ValueError:
                request_log.exception('GET USER FAIL')
                self.finish(json.dumps([]))

            except Exception:
                request_log.exception('GET USER FAIL')
                self.finish(json.dumps([]))

            finally:
                http_client.close()

        elif path == 'list_local':
            user_list = []

            if 'admin' in self.current_user['roles']:
                curr_domain = self.current_user['domain_id']

                downstream_list = self.application.config['downstream']
                for user_id in downstream_list:
                    if downstream_list[user_id]['domain_id'] != curr_domain:
                        continue

                    user_list.append({
                        'id': user_id,
                        'name': downstream_list[user_id]['name'],
                        'tags': downstream_list[user_id]['tags'],
                    })

            self.finish(json.dumps(sorted(user_list, key=lambda x: x['id'])))

        elif path == 'role':
            if 'admin' not in self.current_user['roles']:
                self.send_error(403)
                return

            roles = []
            for role in self.application.config['role']:
                roles.append(role)

            self.finish(json.dumps(roles))

        else:
            self.send_error(404)


class ApiInterfaceHandler(BaseHandler):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        if path == 'list_local':

            if 'services' not in self.current_user['roles']:
                self.send_error(403)
                return

            interface_map = self.application.config['interface']
            interface_list = []
            for inf_id in interface_map:
                interface_list.append({'id': inf_id, 'name': interface_map[inf_id]})

            self.finish(json.dumps(interface_list))

        else:
            self.send_error(404)
