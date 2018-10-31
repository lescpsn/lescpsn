import json
from tornado import gen
from tornado.httpclient import AsyncHTTPClient
import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import BaseHandler

from utils import escape


class ApiBalanceHandler(BaseHandler):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self):
        user_id = self.current_user['partner_id']

        downstream = self.application.config['downstream'][user_id]
        url = downstream['shard']

        balance = '-'

        http_client = AsyncHTTPClient()
        try:
            body = json.dumps({'partner_no': user_id})
            response = yield http_client.fetch("http://{url}/data/balance".format(url=url), method='POST', body=body)

            if response.code == 200:
                resp = json.loads(response.body.decode('utf8'))
                balance = str(resp['balance'])

        except Exception as e:
            print(e)
        finally:
            http_client.close()

        self.finish(balance)
