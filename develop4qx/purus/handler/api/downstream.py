import json
import logging
import random
import string
from tornado.httpclient import AsyncHTTPClient
import tornado.web
import tornado.gen
import yaml
import re

from handler import JsonHandler
from secret import sign_request

__author__ = 'Kevin'

request_log = logging.getLogger('purus.request')

login_re = re.compile('^[0-9a-zA-Z]{4,12}$')


class ApiDownstreamHandler(JsonHandler):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def get(self, path):
        request_log.debug(path)

        if path == 'request':
            return self.get_request()
        elif path == 'template':
            yield self.get_template()
            return

        self.send_error(404)

    def get_request(self):
        request_list = []

        try:
            request_set = sorted(self.master.smembers('set:user:request'))

            for request_id in request_set:
                request_info = self.master.hmget('request:%s' % request_id, [
                    'name', 'mobile', 'qq', 'notes', 'needs', 'login'
                ])
                request_list.append({
                    'id': request_id,
                    'name': request_info[0],
                    'mobile': request_info[1],
                    'qq': request_info[2],
                    'notes': request_info[3] or '',
                    'needs': request_info[4] or '',
                    'login': request_info[5] or ''
                })
        except Exception as e:
            request_log.exception("FAIL")

        self.finish(json.dumps(request_list))

    @tornado.gen.coroutine
    def get_template(self):
        http_client = AsyncHTTPClient()

        try:
            domain_id = self.current_user['domain_id']
            base_url = self.application.config['connection']['repo']

            url = base_url + '/api/user/template?domain_id=' + domain_id

            response = yield http_client.fetch(url)
            resp = response.body.decode()
            self.finish(resp)
        finally:
            http_client.close()

    @tornado.gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        request_log.debug(path)

        if 'admin-customer' not in self.current_user['roles']:
            self.send_error(403)
            return

        if path == 'approval':
            yield self.post_approval()
            return
        elif path == 'reject':
            yield self.post_reject()
            return
        elif path == 'sync':
            yield self.post_sync()
            return
        elif path == 'update':
            yield self.post_update()
            return
        elif path == 'downstream':
            yield self.post_downstream()
            return
        elif path == 'add_operator':
            yield self.post_add_operator()
            return
        elif path == 'reset_pwd':
            yield self.post_reset_pwd()
            return

        self.send_error(404)

    @tornado.gen.coroutine
    def post_downstream(self):
        http_client = AsyncHTTPClient()

        try:
            self.json_args['domain_id'] = self.current_user['domain_id']
            body = json.dumps(self.json_args)

            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/user/list_all'

            response = yield http_client.fetch(url, method='POST', body=body)
            resp = response.body.decode()

            self.finish(resp)
        finally:
            http_client.close()

        # self.finish(resp)
        request_log.info('downstream finish')

    @tornado.gen.coroutine
    def post_add_operator(self):
        http_client = AsyncHTTPClient()

        try:
            self.json_args['domain_id'] = self.current_user['domain_id']
            body = json.dumps(self.json_args)

            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/user/add_operator'

            response = yield http_client.fetch(url, method='POST', body=body)
            resp = response.body.decode()

            self.finish(resp)
        finally:
            http_client.close()

        # self.finish(resp)
        request_log.info('add_operator finish')

    @tornado.gen.coroutine
    def post_sync(self):
        http_client = AsyncHTTPClient()

        try:
            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/user/sync'

            body = json.dumps({'domain_id': self.current_user['domain_id']})

            response = yield http_client.fetch(url, method='POST', body=body)
            resp = response.body.decode()
            self.finish(resp)

        except Exception as e:
            status = 'fail'
            msg = '配置发布失败：' + str(e)
            self.finish(json.dumps({'status': status, 'msg': msg}))

        finally:
            http_client.close()

    @tornado.gen.coroutine
    def post_approval(self):

        http_client = AsyncHTTPClient()

        try:

            user_name = self.json_args.get('name')
            login = self.json_args.get('login')
            request_id = self.json_args.get('request_id')

            if user_name is None or user_name == '':
                raise ValueError('用户名为空')

            if login is None or login == '':
                raise ValueError('登录名为空')

            self.json_args['domain_id'] = self.current_user['domain_id']
            body = json.dumps(self.json_args)

            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/user/add'

            response = yield http_client.fetch(url, method='POST', body=body)
            resp = response.body.decode()
            self.finish(resp)

            if request_id and self.master.sismember('set:user:request', request_id):
                self.master.srem('set:user:request', request_id)
                self.master.delete('request:%s' % request_id)

        except Exception as e:
            status = 'fail'
            msg = '代理商添加失败：' + str(e)
            self.finish(json.dumps({'status': status, 'msg': msg}))

        finally:
            http_client.close()

    @tornado.gen.coroutine
    def post_reject(self):
        status = 'ok'
        msg = '代理商请求删除成功'

        try:
            args = json.loads(self.request.body.decode())

            request_id = args.get('request_id')

            if request_id and self.master.sismember('set:user:request', request_id):
                self.master.srem('set:user:request', request_id)
                self.master.delete('request:%s' % request_id)

        except ValueError as e:
            status = 'fail'
            msg = '代理商请求删除失败：' + str(e)

        self.finish(json.dumps({'status': status, 'msg': msg}))

    @tornado.gen.coroutine
    def post_update(self):

        http_client = AsyncHTTPClient()

        try:
            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/user/update'

            self.json_args['domain_id'] = self.current_user['domain_id']
            body = json.dumps(self.json_args)

            response = yield http_client.fetch(url, method='POST', body=body)
            resp = response.body.decode()
            self.finish(resp)

        except ValueError as e:
            status = 'fail'
            msg = '代理商更新失败：' + str(e)
            self.finish(json.dumps({'status': status, 'msg': msg}))

        finally:
            http_client.close()

    @tornado.gen.coroutine
    def post_reset_pwd(self):
        user_id = self.json_args.get('user_id')

        rand_pass = ''.join(random.sample(string.ascii_letters + string.digits, 6))

        signed = sign_request(rand_pass.encode())

        user_list = self.application.config['user']
        for uid in filter(lambda u: user_list[u]['user_id'] == user_id, user_list):
            self.application.password[uid] = signed
            yaml.dump(self.application.password, open('password.yaml', 'w'))

            request_log.info('USER %s-%s PASSWORD RESETED [%s]', user_id, uid, self.request.remote_ip)

        self.finish(json.dumps({'status': 'ok', 'msg': '密码重置成功，新密码是：%s' % rand_pass}))
