# -*- coding: utf8 -*-
import json
import logging
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from urllib.parse import quote

from handler import JsonHandler

request_log = logging.getLogger("purus.request")


class AdminDataRoutingHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self, path):
        if 'admin-routing' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if path is None:
            self.render('admin_data_routing.html', title=self.application.title)

    @gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        if 'admin-routing' not in self.current_user['roles']:
            self.finish()
            return

        if path == '/all':
            all_routing = {}

            user_id = self.json_args.get('user_id', '*')
            carrier = self.json_args.get('carrier', '*')
            keys = 'route:%s:data:%s:*' % (user_id, carrier)

            partner_id = self.current_user['partner_id']
            base_url = self.application.config['downstream'][partner_id]['shard']
            url = 'http://%s/admin/config?keys=%s' % (base_url, quote(keys))

            request_log.info('LIST ROUTING URL=%s', url)

            http_client = AsyncHTTPClient()

            body = ''

            try:
                request = HTTPRequest(url=url, method='GET', request_timeout=120)
                response = yield http_client.fetch(request)

                if response.code == 200:
                    body = response.body.decode()
                    request_log.debug(body)

            except:
                request_log.exception('DATA_ROUTING FAIL')

            finally:
                http_client.close()

            for line in body.split('\n'):
                request_log.info(line)

                if ' ' not in line:
                    continue

                r1, r2 = line.split(' ')
                r1 = r1.split(':')

                if len(r1) < 7:
                    continue

                user_id = r1[1]

                area = r1[4]
                value = r1[6]

                # TODO: workaround
                if ';' in r2:
                    r2 = r2.split(';')[0]

                if ',' in r2:
                    up_route, price = r2.split(',')
                    discount = '%0.2f' % (int(price) / int(value) / 100)
                else:
                    up_route = 'CLOSE'
                    discount = '100.00'

                routing_area = all_routing.get(area)
                if routing_area is None:
                    routing_area = {}
                    all_routing[area] = routing_area

                routing_up = routing_area.get(up_route)
                if routing_up is None:
                    routing_up = {
                        'user': [],
                        'discount': [],
                        'value': [],
                        'area': area
                    }
                    routing_area[up_route] = routing_up

                if user_id not in routing_up['user']:
                    routing_up['user'].append(user_id)
                    routing_up['user'] = sorted(routing_up['user'])
                if discount not in routing_up['discount']:
                    routing_up['discount'].append(discount)
                if value not in routing_up['value']:
                    routing_up['value'].append(value)
                    routing_up['value'] = sorted(routing_up['value'])
            request_log.info(json.dumps(all_routing))
            self.finish(json.dumps(all_routing))

        else:
            self.finish('')
