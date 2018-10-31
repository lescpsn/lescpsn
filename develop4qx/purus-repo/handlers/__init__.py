# -*- coding: utf-8 -*-
import json

import tornado.ioloop
import tornado.httpserver
import tornado.web
from sqlalchemy.orm import sessionmaker


class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(BaseHandler, self).__init__(application, request)
        self._master = None
        self._slave = None

    @property
    def master(self):
        if self._master is None:
            self._master = self.application.sentinel.master_for('madeira')
        return self._master

    @property
    def slave(self):
        if self._slave is None:
            self._slave = self.application.sentinel.slave_for('madeira')
        return self._slave

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

                return user

        return None


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
