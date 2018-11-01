import json
import logging
import os

import yaml
import shutil
import time

from handler import BaseHandler
from utils import signature

request_log = logging.getLogger("purus.request")


class ConfigHandler(BaseHandler):
    def post(self):
        request_log.info('CONFIG START')

        try:
            safety = self.application.config.get('safety')
            if safety is None:
                request_log.error('CONFIG FAIL (NO SAFETY)')
                return self.send_error(500)

            # verify ip in white list
            if self.request.remote_ip not in safety['white_list']:
                request_log.error("CONFIG FAIL ('%s'NOT IN WHITELIST)",
                                  self.request.remote_ip)
                return self.send_error(500)

            # verify key
            tsp0 = self.request.headers['tsp']
            encrypted0 = self.request.headers['v']
            encrypted1 = signature(tsp0 + safety['secret'])

            if encrypted1 != encrypted0:
                request_log.error('CONFIG FAIL (SECRET FAIL)')
                return self.send_error(500)

            # decode (optional)

            # reload
            body = self.request.body.decode()
            cfg = yaml.load(body)

            if cfg:
                # basic check
                d1 = len(cfg.get('downstream'))
                d0 = len(self.application.config.get('downstream'))
                delta = abs((d1 - d0) * 100 / d0)
                request_log.info('CONFIG DELTA %.3f', delta)

                tsp = time.strftime("%m%d%H%M%S", time.localtime())

                # back config
                shutil.copy('downstream.yaml', 'downstream.yaml.%s' % tsp)

                # write config
                with open('downstream.tmp', 'w', encoding='utf8') as stream:
                    stream.write(body)

                # exist just before overwrite
                if delta > 10 and abs(d1 - d0) > 10:
                    request_log.error('CONFIG FAIL DELTA %.3f (%d)', delta, (d1 - d0))
                    return self.send_error(500)

                # overwrite config
                shutil.move('downstream.tmp', 'downstream.yaml')

                self.application.config['downstream'] = cfg.get('downstream')
                self.application.config['user'] = cfg.get('user')
                self.application.config['domain'] = cfg.get('domain')
                self.application.config['interface'] = cfg.get('interface')

                request_log.info('CONFIG SYNCED (%dK)', len(body) / 1024)
                return self.finish(json.dumps({'status': 'ok'}))

        except Exception as e:
            request_log.exception('CONFIG SYNC FAIL')

        self.send_error(500)
