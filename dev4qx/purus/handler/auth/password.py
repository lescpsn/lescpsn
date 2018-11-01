# -*- coding: utf8 -*-
import json
import logging

import tornado.web
import yaml

from handler import JsonHandler
from db.purus import User
from utils import escape
from secret import sign_request


request_log = logging.getLogger("purus.request")


class PasswordHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self):
        self.current_user['role_name'] = escape.escape_role(self.current_user['role'])
        self.render('password.html', title=self.application.title)

    @tornado.web.authenticated
    def post(self):
        if not {'old_pass', 'new_pass', 'captcha'} <= set(self.json_args):
            return self.write_error(405)

        o = self.json_args.get('old_pass')
        n = self.json_args.get('new_pass')
        c = self.json_args.get('captcha')

        if len(o) == 0 or len(n) == 0 or len(c) != 4:
            request_log.error('CHANGE - BAD POST {%s/%s/%s}', o, n, c)
            print(len(c))
            return self.finish(json.dumps({'status': 'fail', 'msg': '请完整输入用户名密码和验证码'}))

        if len(n) < 6:
            request_log.error('CHANGE - BAD POST {%s/%s/%s}', o, n, c)
            print(len(c))
            return self.finish(json.dumps({'status': 'fail', 'msg': '您输入的新密码过于简单，请重新输入'}))

        # check captcha
        temp_uid = self.get_cookie('_t')
        if not temp_uid:
            return self.finish(json.dumps({'status': 'fail', 'msg': '请正确输入验证码'}))

        master = self.master

        c1 = master.get('captcha:' + temp_uid)

        if not c1 or c1.lower() != c.lower():
            return self.finish(json.dumps({'status': 'fail', 'msg': '验证码不正确或者已失效，请刷新验证码'}))

        master.delete('captcha:' + temp_uid)

        # check password
        user = None
        user_id = self.current_user['id']
        try:
            user = self.application.config.get('user').get(user_id)

            if user is None:
                request_log.error('CHANGE - USER ERROR')
                return self.finish(json.dumps({'status': 'fail', 'msg': '用户信息异常'}))

            if master.exists('user:%s:lock' % user_id):
                request_log.error('CHANGE - LOCKED USER %s', user)
                return self.finish(json.dumps({'status': 'fail', 'msg': '该用户已经被锁定，请稍候重试'}))

            # merge new password
            if user_id in self.application.password:
                user['password'] = self.application.password.get(user_id)

            if user['password'] != sign_request(o.encode()):
                # lock
                k = 'user:%s:try' % user_id
                if master.exists(k):
                    if master.incr(k) > 10:
                        master.setex('user:%s:lock' % user_id, 1, 3600)
                else:
                    master.setex(k, 1, 3600)
                request_log.error('CHANGE - ERROR PASSWORD %s/%s', user['id'], o)
                return self.finish(json.dumps({'status': 'fail', 'msg': '原密码输入错'}))

            user['password'] = sign_request(n.encode())

            self.application.password[user_id] = user['password']
            yaml.dump(self.application.password, open('password.yaml', 'w'))

            self.finish(json.dumps({'status': 'ok'}))
            request_log.info('CHANGE - SUCCESS')

        except Exception as e:
            request_log.error('CHANGE - EXCEPTION %s', e)

