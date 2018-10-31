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


class ApiProductQueryHandler(JsonHandler):
    

    @tornado.gen.coroutine
    def post(self, path):
        if 'services' not in self.current_user['roles']:
            self.send_error(403)
            return
    
        http_client = AsyncHTTPClient()
        
        if path == 'catalog':
            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                body = json.dumps(self.json_args)
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/services/product/catalog'
                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)
            
            except Exception as e:
                request_log.exception('QUERY PRODUCT CATALOG FAIL')                
                self.send_error(500)
                                
            finally:
                http_client.close()
                

        elif path == 'list':
            try:
                self.json_args['domain_id'] = self.current_user['domain_id']
                self.json_args['admin_flag'] = 0
                if 'admin' in self.current_user['roles']:
                    self.json_args['admin_flag'] = 1                
                body = json.dumps(self.json_args)
                base_url = self.application.config['connection']['repo']
                url = base_url + '/api/services/product/list'
                response = yield http_client.fetch(url, method='POST', body=body)
                resp = response.body.decode()
                self.finish(resp)                
                
            except Exception as e:
                request_log.exception('QUERY PRODUCT FAIL')                
                self.send_error(500)
                                
            finally:
                http_client.close()
            
        else:
            self.send_error(404)
