import json
import tornado.web
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from handler import BaseHandler


class AdminCmccFeeRouteSwitchHandler(BaseHandler):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        if 'admin-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if path:
            response = yield self.call_fee_madeira_api(path, "GET")
            self.finish(response)
        else:
            self.render('cmcc_fee_route_switch.html', title=self.application.title)


    @gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        if 'admin-card' not in self.current_user['roles']:
            return self.finish()

        response = yield self.call_fee_madeira_api(path, "POST")
        return self.finish(response)


    @gen.coroutine
    def call_fee_madeira_api(self, path, method):
        url = self.application.config['connection']['quxun_cmcc_fee_card_madeira'] + path

        try:
            http_client = AsyncHTTPClient()
            body = None
            if method == "POST":
                body = json.loads(self.request.body.decode("utf8"))
                body['user_id'] = self.current_user['id'] + " " + self.current_user['name']
                body = json.dumps(body)
            request = HTTPRequest(url=url, method=method, body=body)
            response = yield http_client.fetch(request)

            if response.code == 200:
                return response.body.decode('utf8')

        except Exception as e:
            print(e)

        return ""
