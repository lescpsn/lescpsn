# encoding: utf-8
import json
import logging
import tornado.gen
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from urllib.parse import quote, quote_plus, unquote
import time
import redis
from handler import JsonHandler
from utils import signature
from utils.escape import escape_carrier, escape_area

request_log = logging.getLogger('purus.request')


class ApiRouteHandler(JsonHandler):
    @staticmethod
    def get_name(ttl):
        if ttl == '-1':
            return '长期'

        ttl = float(ttl)
        if ttl < 60:
            return '<1分钟'

        # min
        ttl /= 60
        if ttl < 60:
            return '%d分钟' % int(ttl)

        # hour
        ttl /= 60
        if ttl < 24:
            return '%.1f小时' % ttl

        # day
        ttl /= 24
        return '%.1f天' % ttl

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def get(self, path):
        if 'admin-route' not in self.current_user['roles']:
            self.send_error(403)
            return

        http_client = AsyncHTTPClient()

        if path == 'supply/list':

            try:
                base_url = self.application.config['connection']['repo']

                url = base_url + '/api/route/supply/list?domain_id=' + self.current_user['domain_id']
                response = yield http_client.fetch(url, method='GET')
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'maintain/list':

            try:
                partner_id = self.current_user['partner_id']
                base_url = self.application.config['downstream'][partner_id]['shard']
                url = 'http://%s/admin/config?keys=%s&with_ttl=true' % (base_url, quote("maintain:*"))
                response = yield http_client.fetch(url, method='GET')

                body = response.body.decode()

                if_map = self.application.config.get('interface')
                downstream = self.application.config.get('downstream')

                maintain_list = []
                for line in sorted(body.strip().split('\n')):
                    request_log.debug('MAINTAIN {%s}', line)
                    
                    if line != '':
                        key, notes, ttl = line.split(' ')
                        values = key.split(':')
                        if len(values) < 4 or len(values) > 5:
                            request_log.error('UNKNOWN MAINTAIN FORMAT %s', line)
                            continue
                        
                        ttl_name = self.get_name(ttl)
                        
                        route = values[1]
                        route_n = if_map.get(route, route)
                        carrier = values[2]
                        carrier_n = escape_carrier(carrier)
                        area = values[3]
                        area_n = escape_area(area)
                        if len(values) > 4:
                            user_id = values[4]
                            user_name = downstream.get(user_id, {'name:': '*'}).get('name')
                        else:
                            user_id = None
                            user_name = '(全部)'
                        
                        maintain_list.append({
                            'key': key,
                            'route': route,
                            'route_n': route_n,
                            'carrier': carrier,
                            'carrier_n': carrier_n,
                            'area': area,
                            'area_n': area_n,
                            'user_id': user_id,
                            'user_name': user_name,
                            'ttl_name': ttl_name,
                            'notes': unquote(notes)})

                self.finish(json.dumps(maintain_list))

            finally:
                http_client.close()

        elif path == 'pool/list':
            try:
                partner_id = self.current_user['partner_id']
                base_url = self.application.config['downstream'][partner_id]['shard']
                url = 'http://%s/admin/config?keys=%s' % (base_url, quote("pool:*"))
                response = yield http_client.fetch(url, method='GET')

                body = response.body.decode()
                r_db0 = self.application.sentinel.master_for('madeira', db=0)
                keys_list = r_db0.keys("pool:*")
                datapool_list = []
                for line in sorted(body.strip().split('\n')):
                    if line != '':
                        madeira_key, value = line.split(' ')
                        for key in keys_list:
                            if key == madeira_key:
                                tmp_dict = r_db0.hgetall(key)
                                tmp_dict['key'] = key
                                datapool_list.append(tmp_dict)
                                tmp_dict['number'] = value
                                datapool_list.append(tmp_dict)

                resp_data = {'status': "ok", 'data': datapool_list}
                self.finish(json.dumps(resp_data))

            except Exception as e:
                request_log.exception('QUERY POOL FAIL')
                #self.finish(json.dumps({"msg": "查询异常:" + repr(e)}))
                self.send_error(500)
            finally:
                http_client.close()

        elif path == 'pool/interface':
            try:
                r_db0 = self.application.sentinel.master_for('madeira', db=0)
                keys_list = r_db0.keys("pool:*")
                                
                datapool_interface_list = []
                for key in keys_list:
                    tmp_dict = r_db0.hgetall(key)
                    tmp_dict['key'] = key
                    datapool_interface_list.append(tmp_dict)

                resp_data = {'status': "ok", 'data': datapool_interface_list}
                self.finish(json.dumps(resp_data))

            except Exception as e:
                request_log.exception('QUERY POOL INTERFACE FAIL')
                #self.finish(json.dumps({"msg": "查询异常:" + repr(e)}))
                self.send_error(500)

        else:
            self.send_error(404)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self, path):
        if 'admin-route' not in self.current_user['roles']:
            self.send_error(403)
            return

        http_client = AsyncHTTPClient()

        if path == 'interface/list':
            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                #self.json_args['domain_id'] = 00000
                body = json.dumps(self.json_args)
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/route/interface/list'
                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'interface/price':

            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                base_url = self.application.config['connection']['repo']

                url = base_url + '/api/route/interface/price'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()


        elif path == 'interface/price/add':
            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/route/interface/price/add'
                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()   


        elif path == 'interface/price/remove':
            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/route/interface/price/remove'
                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close() 
                
                                                
        elif path == 'interface/price/modify':
            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                base_url = self.application.config['connection']['repo']

                url = base_url + '/api/route/interface/price/modify'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()                

        elif path == 'interface/score':

            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)

                base_url = self.application.config['connection']['repo']

                url = base_url + '/api/route/interface/score'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'supply/save_update':

            self.json_args['domain_id'] = self.current_user['domain_id']

            try:
                base_url = self.application.config['connection']['repo']
                body = json.dumps(self.json_args)

                url = base_url + '/api/route/supply/save_update'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'supply/delete':

            self.json_args['domain_id'] = self.current_user['domain_id']

            try:
                base_url = self.application.config['connection']['repo']
                body = json.dumps(self.json_args)

                url = base_url + '/api/route/supply/delete'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'product/list':

            self.json_args['domain_id'] = self.current_user['domain_id']

            try:
                base_url = self.application.config['connection']['repo']
                body = json.dumps(self.json_args)

                url = base_url + '/api/route/product/list'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'product/update':

            self.json_args['domain_id'] = self.current_user['domain_id']

            try:
                base_url = self.application.config['connection']['repo']
                body = json.dumps(self.json_args)

                url = base_url + '/api/route/product/update'

                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)

            finally:
                http_client.close()

        elif path == 'maintain/remove':
            try:
                key = self.json_args.get('key')

                body = 'del ' + key
                secret = self.application.config.get('safety').get('secret')

                tsp = str(int(time.mktime(time.localtime())))
                v = signature(tsp + secret)

                partner_id = self.current_user['partner_id']
                base_url = self.application.config['downstream'][partner_id]['shard']

                url = 'http://%s/admin/pricing' % base_url
                response = yield http_client.fetch(url, method='POST', body=body,
                                                   headers={'tsp': tsp, 'v': v},
                                                   request_timeout=120)

                body = response.body.decode()
                self.finish(json.dumps({"msg": "删除成功"}))
            except Exception as e:
                request_log.exception('MAINTAIN FAIL')
                self.finish(json.dumps({"msg": "删除异常:" + repr(e)}))

            finally:
                http_client.close()

        elif path == 'maintain/add':
            try:
                route = self.json_args.get('route')
                carrier = self.json_args.get('carrier')
                area = self.json_args.get('area')
                user_id = self.json_args.get('user_id')
                ttl = self.json_args.get('ttl')
                ttl_value = self.json_args.get('ttl_value')
                notes = quote_plus(self.json_args.get('notes'))

                if notes == '':
                    notes = quote_plus('维护')

                if ttl is None or ttl == '' or not ttl_value.isdigit():
                    ttl_value = None
                elif ttl == 'hour':
                    ttl_value = int(ttl_value) * 3600
                elif ttl == 'min':
                    ttl_value = int(ttl_value) * 60
                elif ttl == 'day':
                    ttl_value = int(ttl_value) * 3600 * 24

                key = 'maintain:%s:%s:%s' % (route, carrier, area)

                if user_id and user_id != '':
                    key = key + ':' + user_id

                if ttl_value:
                    body = 'setex %s %s %d' % (key, notes, ttl_value)
                else:
                    body = 'set %s %s' % (key, notes)

                secret = self.application.config.get('safety').get('secret')

                tsp = str(int(time.mktime(time.localtime())))
                v = signature(tsp + secret)

                partner_id = self.current_user['partner_id']
                base_url = self.application.config['downstream'][partner_id]['shard']

                url = 'http://%s/admin/pricing' % base_url
                response = yield http_client.fetch(url, method='POST', body=body,
                                                   headers={'tsp': tsp, 'v': v},
                                                   request_timeout=120)

                body = response.body.decode()
                self.finish(json.dumps({"msg": "添加成功"}))
            except Exception as e:
                request_log.exception('MAINTAIN FAIL')
                self.finish(json.dumps({"msg": "添加异常:" + repr(e)}))

            finally:
                http_client.close()

        elif path == 'pool/add':
            try:
                key = self.json_args.get('key')
                number = self.json_args.get('number')
                notes = self.json_args.get('notes')
                #notes暂为处理
                value=number
                body = 'set %s %s' % (key, value)
                secret = self.application.config.get('safety').get('secret')

                tsp = str(int(time.mktime(time.localtime())))
                v = signature(tsp + secret)
                partner_id = self.current_user['partner_id']
                base_url = self.application.config['downstream'][partner_id]['shard']
                url = 'http://%s/admin/pricing' % base_url
                response = yield http_client.fetch(url, method='POST', body=body,
                                                   headers={'tsp': tsp, 'v': v},
                                                   request_timeout=120)
                body = response.body.decode()
                self.finish(json.dumps({"msg": "添加成功"}))

            except Exception as e:
                request_log.exception('ADD POOL FAIL')
                self.finish(json.dumps({"msg": "添加异常:" + repr(e)}))

        elif path == 'pool/remove':
            try:

                key = self.json_args.get('key')
                body = 'del ' + key
                secret = self.application.config.get('safety').get('secret')

                tsp = str(int(time.mktime(time.localtime())))
                v = signature(tsp + secret)

                partner_id = self.current_user['partner_id']
                base_url = self.application.config['downstream'][partner_id]['shard']

                url = 'http://%s/admin/pricing' % base_url
                response = yield http_client.fetch(url, method='POST', body=body,
                                                   headers={'tsp': tsp, 'v': v},
                                                   request_timeout=120)

                body = response.body.decode()
                self.finish(json.dumps({"msg": "删除成功"}))

            except Exception as e:
                request_log.exception('DELETE POOL FAIL')
                self.finish(json.dumps({"msg": "删除异常:" + repr(e)}))


        else:
            self.send_error(404)
