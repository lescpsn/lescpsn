# -*- coding: utf8 -*-
import json

import tornado.ioloop
import tornado.httpserver
import tornado.web
from sqlalchemy.orm import sessionmaker


class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(BaseHandler, self).__init__(application, request)
        self._operator_name = 'NO_LOGIN'

    @property
    def master(self):
        return self.application.redis_driver.master

    @property
    def slave(self):
        return self.application.redis_driver.slave

    # @property
    # def kv(self):
    # return (
    # self.application.config['partner']['key'],
    # self.application.config['partner']['vi'])

    def session(self, name):
        if name in self.application.engine:
            engine = self.application.engine[name]
            return sessionmaker(bind=engine)()
        return None

    def get_current_user(self):
        token = self.get_cookie("_token")
        if token:
            key = 'token:%s' % token
            user_id = self.master.get(key)
            self.master.expire(key, 1800)  # reset token ttl

            if user_id:
                user = self.master.hgetall('user:' + user_id)
                user['id'] = user_id
                user['roles'] = self.master.smembers("role:" + user_id)
                self._operator_name = user['name']
                return user

        return None

    def _request_summary(self):
        return "%s %s (%s@%s)" % (self.request.method, self.request.uri,
                                  self._operator_name, self.request.remote_ip)

    def resp_json_result(self, status, msg, data=None):
        resp_data = {'status':status, 'msg':msg, 'data':data}

        resp_data = json.dumps(resp_data)
        return self.finish(resp_data)

class JsonHandler(BaseHandler):
    def __init__(self, application, request, **kwargs):
        super(JsonHandler, self).__init__(application, request)
        self.json_args = None

    def prepare(self):
        if self.request.method == 'POST':
            b = self.request.body
            # print(b)
            try:
                self.json_args = json.loads(b.decode('utf8'))
            except:
                self.json_args = {}


class ReactContentHandler(BaseHandler):
    def __init__(self, application, request, path, **kwargs):
        super(ReactContentHandler, self).__init__(application, request, **kwargs)
        self.path = path
        self.role = None

        if 'role' in kwargs:
            self.role = kwargs.get('role')

    @tornado.web.authenticated
    def get(self, *args):
        if self.role and self.role not in self.current_user['roles']:
            self.send_error(403)
            return

        self.render(self.path, title=self.application.title)


class JsonHandler2(BaseHandler):
    def __init__(self, application, request, **kwargs):
        super(JsonHandler2, self).__init__(application, request)

    def prepare(self):
        if self.current_user:
            self.user_id  = self.current_user.get('partner_id')

        args = {}
        for argument in self.request.arguments:
            if argument != 'requ_type':
                args[argument] = self.get_argument(argument)

        self.args = args
        self.requ_type = self.get_argument('requ_type', None)
        self.argu_list = args

        if self.request.method == 'POST' and self.requ_type == None:
            requ_body = self.request.body.decode()
            args = json.loads( requ_body )

            self.args = args
            self.requ_type = args['requ_type']
            self.argu_list = args.get('argu_list', {})
