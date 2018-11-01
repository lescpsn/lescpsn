# encoding: utf8

import logging
from handler import JsonHandler

__author__ = 'Kevin'

request_log = logging.getLogger('purus.request')

SOFT_LIMIT = 50


class ApiRegisterHandler(JsonHandler):
    def post(self):

        self.set_header('Access-Control-Allow-Origin', '*')

        try:
            if self.master.scard("set:user:request") > SOFT_LIMIT:
                raise ValueError('系统忙，请稍后')

            name = self.json_args.get('name')
            login = self.json_args.get('login')
            mobile = self.json_args.get('mobile')
            qq = self.json_args.get('qq')
            notes = self.json_args.get('notes')
            needs = self.json_args.get('needs')

            if name is None or len(name) == 0:
                raise ValueError('请输入你的姓名')

            if (mobile is None or len(mobile) == 0) and (qq is None or len(qq) == 0):
                raise ValueError('请留下至少一种联系方式')

            register_id = self.master.incrby('uid:register', 3)

            self.master.hmset('request:%d' % register_id, {
                'name': name or '',
                'login': login or '',
                'mobile': mobile or '',
                'qq': qq or '',
                'notes': notes or '',
                'needs': needs or '',
            })

            request_log.info('REQUEST ADDED (%s) %s', register_id, name)

            self.master.sadd('set:user:request', register_id)

            self.finish({'status': 'ok', 'msg': '我们已经收到您的申请，稍后客服会和您取得联系'})

        except ValueError as e:
            self.finish({'status': 'fail', 'msg': str(e)})

        except:
            self.send_error(500)
