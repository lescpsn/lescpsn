import logging
import os
from tornado.web import StaticFileHandler

import yaml

from handler import BaseHandler

request_log = logging.getLogger("purus.request")


class ReloadHandler(BaseHandler):
    def get(self):
        request_log.info('ACCESS RELOAD (%s)', self.request.remote_ip)

        if self.request.remote_ip not in ['127.0.0.1', '::1']:
            return self.send_error(403)

        try:
            cfg = yaml.load(open('config.yaml', 'r', encoding='utf8'))

            if os.path.exists('downstream.yaml'):
                cfg_d = yaml.load(open('downstream.yaml', 'r', encoding='utf8'))
                cfg['downstream'] = cfg_d['downstream']
                cfg['user'] = cfg_d['user']
                cfg['domain'] = cfg_d['domain']
                cfg['interface'] = cfg_d['interface']

                self.application.config = cfg

                for downstream in sorted(cfg['downstream']):
                    self.write(downstream + '\n')

            if os.path.exists('password.yaml'):
                password = yaml.load(open('password.yaml', 'r', encoding='utf8'))
                self.application.password = password

            self.finish()

            StaticFileHandler.reset()

        except Exception as e:
            request_log.exception('RELOAD FAIL')
            return self.finish('RELOAD FAIL %s' % repr(e))
