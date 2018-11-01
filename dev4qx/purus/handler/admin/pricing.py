# -*- coding: utf8 -*-
import logging

from handler import BaseHandler
from utils import signature

request_log = logging.getLogger("purus.request")


class PricingHandler(BaseHandler):
    def post(self):
        request_log.info('PRICE CONFIG START')

        try:
            safety = self.application.config.get('safety')
            if safety is None:
                request_log.error('CONFIG FAIL (NO SAFETY)')
                return self.send_error(500)

            # verify ip in white list
            if self.request.remote_ip not in safety['white_list']:
                request_log.error('CONFIG FAIL (NOT IN WHITELIST)')
                return self.send_error(500)

            # verify key
            tsp0 = self.request.headers['tsp']
            encrypted0 = self.request.headers['v']
            encrypted1 = signature(tsp0 + safety['secret'])

            if encrypted1 != encrypted0:
                request_log.error('CONFIG FAIL (SECRET FAIL)')
                return self.send_error(500)

            # reload
            body = self.request.body.decode()
            for line in body.split('\n'):
                request_log.debug(line)

                if line.startswith('set'):
                    keys = line.split()
                    self.master.set(keys[1], keys[2])

                elif line.startswith('hmset'):
                    keys = line.split()
                    mapping = {keys[x]: keys[x + 1] for x in range(2, len(keys), 2)}
                    self.master.hmset(keys[1], mapping)

                elif line.startswith('del'):
                    keys = line.split()
                    self.master.delete(keys[1])

            return self.finish()

        except Exception as e:
            request_log.exception('CONFIG SYNC FAIL')

        self.send_error(500)
