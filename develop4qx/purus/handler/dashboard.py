# -*- coding: utf8 -*-
import json
from tornado import gen
from tornado.httpclient import AsyncHTTPClient
import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import BaseHandler
from utils import escape


class MainHandler(BaseHandler):
    @gen.coroutine
    def get_balance(self):

        user_id = self.current_user['partner_id']

        downstream = self.application.config['downstream'][user_id]
        url = downstream['shard']

        balance = 0
        http_client = AsyncHTTPClient()
        try:
            body = json.dumps({'partner_no': user_id})
            response = yield http_client.fetch("http://{url}/data/balance".format(url=url), method='POST', body=body)

            if response.code == 200:
                resp = json.loads(response.body.decode('utf8'))
                balance = float(resp['balance'])

        except Exception as e:
            print(e)
        finally:
            http_client.close()

        return balance

    @gen.coroutine
    @tornado.web.authenticated
    def get(self):
        balance = yield self.get_balance()
        self.current_user['role_name'] = escape.escape_role(self.current_user['role'])
        self.render('index.html', balance=balance, remote_ip=self.request.remote_ip, title=self.application.title)

