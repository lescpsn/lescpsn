# -*- coding: utf8 -*-
import json
import logging

from handler import BaseHandler, JsonHandler
from secret import sign_request
from utils import rand_number

request_log = logging.getLogger("purus.request")


class LogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("_token")
        self.redirect("/auth/login")


class LoginHandler(JsonHandler):
    def get(self):
        request_log.info('GET LOGIN %s [%s]', self.request.remote_ip, self.request.host)

        domain_list = self.application.config['domain']
        domain_id = next(filter(lambda k: domain_list[k]['host'] == self.request.host, domain_list), None)
        if domain_id is None:
            self.send_error(403)
            return

        icp = self.application.config['config'].get('icp', '')
        cr = self.application.config['config'].get('copyright', '')

        temp_uid = rand_number.token(16)
        self.set_cookie('_t', temp_uid)

        self.render('login.html', title=domain_list[domain_id]['title'], icp=icp, copyright=cr)

    def post(self):
        ip = self.request.remote_ip
        request_log.info('TRY LOGIN [%s]', ip)

        if not {'user', 'password', 'captcha'} <= set(self.json_args):
            return self.write_error(405)

        u = self.json_args.get('user').strip()
        p = self.json_args.get('password')
        c = self.json_args.get('captcha')

        if len(u) == 0 or len(p) == 0 or len(c) != 4:
            request_log.error('LOGIN - BAD POST {%s/%s/%s} [%s]', u, p, c, ip)
            print(len(c))
            return self.finish(json.dumps({'status': 'fail', 'msg': '请完整输入用户名密码和验证码'}))

        # check captcha
        temp_uid = self.get_cookie('_t')
        if not temp_uid:
            return self.finish(json.dumps({'status': 'fail', 'msg': '请正确输入验证码'}))

        master = self.master

        c1 = master.get('captcha:' + temp_uid)

        if not c1 or c1.lower() != c.lower():
            return self.finish(json.dumps({'status': 'fail', 'msg': '验证码输入错误或已失效，请刷新验证码'}))

        master.delete('captcha:' + temp_uid)

        user_list = self.application.config.get('user')
        user_id = next(filter(lambda i: u == user_list[i]['login'], user_list), None)

        if user_id is None:
            request_log.error('LOGIN - USER NOT FOUND {%s} [%s]', u, ip)
            return self.finish(json.dumps({'status': 'fail', 'msg': '用户名或者密码错'}))

        user = user_list[user_id]

        downstream = self.application.config.get('downstream').get(user['user_id'])

        if downstream is None:
            request_log.error('LOGIN - DOWNSTREAM NOT FOUND {%s} [%s]', u, ip)
            return self.finish(json.dumps({'status': 'fail', 'msg': '用户名或者密码错'}))


        # checking domain
        domain_list = self.application.config['domain']
        current_domain = next(filter(lambda k: domain_list[k]['host'] == self.request.host, domain_list), None)

        if current_domain is None or downstream['domain_id'] != current_domain:
            return self.finish(json.dumps({'status': 'fail', 'msg': '用户名或者密码错'}))

        # merge new password
        if user_id in self.application.password:
            user['password'] = self.application.password.get(user_id)

        roles = None
        if user['role']:
            roles = self.application.config['role'].get(user['role'])

        if master.exists('user:%s:lock' % user_id):
            request_log.error('LOGIN - LOCKED USER %s [%s]', u, ip)
            return self.finish(json.dumps({'status': 'fail', 'msg': '该用户已经被锁定，请稍候重试'}))

        if user['password'] != sign_request(p.encode()):
            # lock
            k = 'user:%s:try' % user_id
            if master.exists(k):
                if master.incr(k) > 10:
                    master.setex('user:%s:lock' % user_id, 1, 3600)
            else:
                master.setex(k, 1, 3600)
            request_log.error('LOGIN - ERROR PASSWORD %s/%s [%s]', u, p, ip)
            return self.finish(json.dumps({'status': 'fail', 'msg': '用户名或者密码错'}))

        # Token
        token = rand_number.token(16)
        key_token = 'token:%s' % token
        master.set(key_token, user_id)
        master.expire(key_token, 3600)

        # user:*
        k = 'user:%s' % user_id

        master.hmset(k, {
            'name': user['login'],
            'password': user['password'],
            'role': user['role'],
            'partner_id': user['user_id'],
            'display_name': user['name'],
            'domain_id': downstream['domain_id']
        })

        # role:*
        if roles:
            k = 'role:%s' % user_id
            master.delete(k)
            master.sadd(k, *roles)

        self.set_cookie("_token", token)
        self.finish(json.dumps({'status': 'ok'}))

        request_log.info('LOGIN - SUCCESS %s %s [%s]', u, roles, ip)
