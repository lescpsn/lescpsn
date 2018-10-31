import logging
import os

import yaml

from handlers import BaseHandler

request_log = logging.getLogger("madeira.request")


class ReloadHandler(BaseHandler):
    def get(self):
        request_log.info('ACCESS RELOAD (%s)', self.request.remote_ip, extra={'orderid': 'RELOAD'})

        if self.request.remote_ip not in ['127.0.0.1', '::1']:
            return self.send_error(403)

        try:
            cfg = yaml.load(open('config.yaml', 'r', encoding='utf8'))

            if os.path.exists('downstream.yaml'):
                cfg_d = yaml.load(open('downstream.yaml', 'r', encoding='utf8'))
                cfg['downstream'] = cfg_d.get('downstream')

            self.application.config = cfg

            for downstream in sorted(cfg['downstream']):
                self.write(downstream + '\n')

        except Exception as e:
            request_log.exception('RELOAD FAIL')
            return self.finish('RELOAD FAIL %s' % repr(e))

        self.finish()
