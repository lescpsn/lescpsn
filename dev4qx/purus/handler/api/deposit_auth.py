# -*- coding: utf8 -*-
import logging
from handler import JsonHandler
import tornado.web
import json
import onetimepass as otp

request_log = logging.getLogger("purus.request")


class ApiDepositAuth(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    @tornado.web.authenticated
    def post(self):
        cfg = self.application.config.get('deposit_agent')

        operator_id = self.current_user['id']
        args = self.json_args
        auth_num = args.get('auth_num')
        type = args.get('type')
        secret = None
        ttl = 0
        interval = 30

        if type == 'approve':
            secret = cfg['op_secret'].get(operator_id)
            ttl = 60 * 60
            interval = 30
        elif type == 'quota':
            secret = cfg['secret']
            ttl = 60 * 10
        else:
            self.send_error(500)

        flag = otp.valid_totp(auth_num, secret, interval_length=interval, window=1)
        request_log.info('AUTH %s %s', type, flag)

        if flag:
            self.master.setex('auth:%s:%s' % (operator_id, type), ttl, 'ok')
        else:
            self.finish(json.dumps({'status': 'fail', 'msg': '认证码错误,请重新操作'}))
            return

        self.finish(json.dumps({'status': 'success'}))


class ApiDepositCheckAuth(JsonHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

    def post(self):
        operator_id = self.current_user['id']
        args = self.json_args
        type = args.get('type')

        flag = self.master.get('auth:%s:%s' % (operator_id, type))
        if not flag:
            self.finish(json.dumps({'status': 'fail'}))
            return
        self.finish(json.dumps({'status': 'success'}))


class ApiDepositRefreshAuth(JsonHandler):
    def post(self):
        operator_id = self.current_user['id']
        args = self.json_args
        type = args.get('type')

        if type not in ['approve']:
            self.send_error(500)

        k = 'auth:%s:%s' % (operator_id, type)

        if self.master.exists(k):
            self.master.expire(k, 60 * 60)
            self.finish(json.dumps({'status': 'success'}))
        else:
            self.finish(json.dumps({'status': 'fail'}))
