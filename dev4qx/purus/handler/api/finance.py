# encoding: utf8
import base64
from Crypto.Cipher import AES
from datetime import datetime
import logging
import math
import json
import tornado.ioloop
import tornado.httpserver
import tornado.web
import tornado.gen
import pymongo
from tornado.httpclient import AsyncHTTPClient

from handler import JsonHandler
from secret import padding
from utils.escape import escape_fee_result, escape_area, escape_carrier, escape_data_result, escape_sinopec_result, \
    escape_finance_type

PRODUCT_LIST = ['fee', 'data', 'sinopec']

request_log = logging.getLogger("purus.request")


class ApiOrderExportHandler(JsonHandler):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self, product):

        args = self.json_args
        user_id = self.current_user['partner_id']
        args['user_id'] = user_id
        args['criteria']['product'] = product

        if 'admin' not in self.current_user['roles']:
            args['criteria']['user_id'] = user_id

        body = json.dumps(args)

        http_client = AsyncHTTPClient()

        try:
            downstream = self.application.config['downstream'][user_id]

            iv = downstream['iv']
            passphrase = downstream['pass']
            aes = AES.new(passphrase, AES.MODE_CBC, iv)

            b = aes.encrypt(padding(body))
            encrypted = base64.b64encode(b).decode()

            base_url = self.application.config['connection']['glados_hall']
            url = base_url + '/export/request'
            headers = {'User': user_id}

            response = yield http_client.fetch(url, method='POST', headers=headers, body=encrypted)
            resp = response.body.decode()

            self.finish(resp)

        except:
            request_log.exception('EXPORT FAIL')
            self.finish(json.dumps({'status': 'fail', 'msg': '导出异常，请稍后尝试'}))

        finally:
            http_client.close()


