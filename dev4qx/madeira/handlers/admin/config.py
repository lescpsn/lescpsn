import json
import logging
import os

import yaml
import shutil
import time

from tornado import gen

from handlers import BaseHandler, signature

request_log = logging.getLogger("madeira.request")


class ConfigHandler(BaseHandler):
    @gen.coroutine
    def get(self):
        request_log.info('CONFIG GET', extra={'orderid': 'CONFIG'})

        try:
            safety = self.application.config.get('safety')
            if safety is None:
                request_log.error('FAIL (NO SAFETY)', extra={'orderid': 'CONFIG'})
                return self.send_error(500)

            # verify ip in white list
            if self.request.remote_ip not in safety['white_list']:
                request_log.error("FAIL ('%s'NOT IN WHITELIST)", self.request.remote_ip,
                                  extra={'orderid': 'CONFIG'})
                return self.send_error(500)

            master = self.master

            keys = self.get_argument('keys')

            with_ttl = self.get_argument('with_ttl', None)

            cursor = 0
            n = 0
            for n in range(10000):
                cursor, key_list = master.scan(cursor, keys, 1000)

                for key in key_list:
                    tp = master.type(key)

                    if tp == 'string':

                        if with_ttl:
                            value = master.get(key)
                            ttl = master.ttl(key)
                            self.write('%s %s %d\n' % (key, value, ttl))
                        else:
                            value = master.get(key)
                            self.write('%s %s\n' % (key, value))

                if cursor == 0:
                    break

                yield gen.moment

            request_log.info('CONFIG GET AFTER %d', n, extra={'orderid': 'CONFIG'})
            self.finish()

        except Exception as e:
            request_log.exception('GET FAIL', extra={'orderid': 'CONFIG'})
            self.send_error(500)

    def post(self):
        request_log.info('CONFIG START', extra={'orderid': 'CONFIG'})

        try:
            safety = self.application.config.get('safety')
            if safety is None:
                request_log.error('FAIL (NO SAFETY)', extra={'orderid': 'CONFIG'})
                return self.send_error(500)

            # verify ip in white list
            if self.request.remote_ip not in safety['white_list']:
                request_log.error("FAIL ('%s'NOT IN WHITELIST)",
                                  self.request.remote_ip,
                                  extra={'orderid': 'CONFIG'})
                return self.send_error(500)

            # verify key
            tsp0 = self.request.headers['tsp']
            encrypted0 = self.request.headers['v']
            encrypted1 = signature(tsp0 + safety['secret'])

            if encrypted1 != encrypted0:
                request_log.error('FAIL (SECRET FAIL)', extra={'orderid': 'CONFIG'})
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
                request_log.info('DELTA %.3f', delta, extra={'orderid': 'CONFIG'})

                tsp = time.strftime("%m%d%H%M%S", time.localtime())

                # back config
                shutil.copy('downstream.yaml', 'downstream.yaml.%s' % tsp)

                # write config
                with open('downstream.tmp', 'w', encoding='utf8') as stream:
                    stream.write(body)

                if delta > 10 and abs(d1 - d0) > 10:
                    request_log.error('CONFIG FAIL DELTA %.3f', delta, extra={'orderid': 'CONFIG'})
                    return self.send_error(500)

                shutil.move('downstream.tmp', 'downstream.yaml')

                self.application.config['downstream'] = cfg.get('downstream')

                request_log.info('SYNCED', extra={'orderid': 'CONFIG'})
                return self.finish(json.dumps({'status': 'ok'}))

        except Exception as e:
            request_log.exception('SYNC FAIL', extra={'orderid': 'CONFIG'})

        self.send_error(500)
