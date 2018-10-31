from handler.fuel_card import FuelCardBaseHandler
from tornado import gen, web
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import json
import logging

log = logging.getLogger("purus.request")


class FuelCardCallModemForrestalHandler(FuelCardBaseHandler):
    @web.authenticated
    @gen.coroutine
    def post(self, path):
        if 'fuel-card' not in self.current_user['roles']:
            return self.finish()
        
        yield self.transmit(path, "POST")

    @gen.coroutine
    def transmit(self, path, method):
        url = self.application.config['connection']['quxun_sinopec_card_forrestal'] + path

        #此处需要检测订单是否是这个用户的
        http_client = AsyncHTTPClient()
        body = None
        if method == "POST":
            body = json.loads(self.request.body.decode())
            body['up_user_id'] = self.current_user['partner_id']
            body['user_id'] = self.current_user['partner_id'] + " " + self.current_user['name']
            body = json.dumps(body)

        request = HTTPRequest(url=url, method=method, body=body)
        response = yield http_client.fetch(request)
        self.finish(response.body.decode())

