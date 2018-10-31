import json
import tornado
from handler import JsonHandler
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

class AdminFeeQuotaHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self):
        if 'admin' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        return self.render('fee_quota.html', title=self.application.title)

    @gen.coroutine
    @tornado.web.authenticated
    def post(self):
        if 'admin' not in self.current_user['roles']:
            return self.finish()

        response= []
        request_type = self.json_args.get('request_type')
        if request_type == 'query':
            up_user_id = self.json_args.get('up_user_id')
            response = yield self.call_machado_ranger_api('GET',up_user_id)
        else:
            response = yield self.call_machado_ranger_api('POST')

        if response:
            return self.finish(json.dumps(response))
        else:
            return self.finish()


    @gen.coroutine
    def call_machado_ranger_api(self,method,up_user_id=None):
        url = 'http://localhost:8902/admin/quota'
        if up_user_id:
            url += ("/" + up_user_id)

        user_info_list =[]
        try:
            http_client = AsyncHTTPClient()
            body = None
            if method == "POST":
                body = self.request.body.decode("utf8")
            request = HTTPRequest(url=url, method=method, body=body)
            response = yield http_client.fetch(request)

            if response.code == 200:
                user_info_list = json.loads(response.body.decode('utf8'))
                for user in user_info_list:
                    user['user_name'] = self.application.config['downstream'][user['user_id']]['name']

        except Exception as e:
            pass

        return user_info_list