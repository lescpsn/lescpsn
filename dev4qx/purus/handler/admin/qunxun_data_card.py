import json
import tornado.web
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from handler import BaseHandler

#返回对应的页面
class AdminQuxunDataCardPageHandler(BaseHandler):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        if 'data-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if not path:
            return self.send_error()
        elif path.find('.') != -1:
            return self.send_error()
        else:
            return self.render(path[1:]+".html", title=self.application.title)

#转发所有的post请求
class AdminQuxunDataCardHandler(BaseHandler):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        if 'data-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if path:
            response = yield self.call_huallaga_api(path, "GET")
            return self.finish(response)
        else:
            return self.send_error(404)

    @gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        if 'data-card' not in self.current_user['roles']:
            return self.finish()

        response = yield self.call_huallaga_api(path, "POST")
        return self.finish(response)

    @gen.coroutine
    def call_huallaga_api(self, path, method):
        url = self.application.config['connection']['quxun_data_card'] + path
        try:
            http_client = AsyncHTTPClient()
            body = None
            if method == "POST":
                body = json.loads(self.request.body.decode("utf8"))
                body['user_id'] = self.current_user['partner_id']
                body = json.dumps(body)

            request = HTTPRequest(url=url, method=method, body=body)
            response = yield http_client.fetch(request)

            if response.code == 200:
                return response.body.decode('utf8')

        except Exception as e:
            pass

        return ""

class AdminQuxunDataCardFileHandler(BaseHandler):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        if 'data-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        user_id = self.current_user['partner_id']

        #文件名检测
        path = path[1:]
        if path.find('/') != -1 or path.find('\\') != -1:
            return self.send_error(403)

        #用户ID判断
        index = path.find('_')
        u_id = path[:index]
        if u_id != user_id:
            return self.send_error(403)

        url = '{0}/card_files/{1}/{2}'.format(self.application.config['connection']['quxun_data_card'], user_id, path)
        print(url)
        http_client = AsyncHTTPClient()

        try:
            request = HTTPRequest(url=url)
            response = yield http_client.fetch(request)
            self.set_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            return self.finish(response.body)

        except Exception as e:
            return self.send_error(403)
