# -*- coding: utf8 -*-
import logging

from handlers import BaseHandler, signature

request_log = logging.getLogger("madeira.request")


class PricingHandler(BaseHandler):
    def post(self):
        request_log.info('PRICE CONFIG START', extra={'orderid': 'UNKNOWN'})

        try:
            safety = self.application.config.get('safety')
            if safety is None:
                request_log.error('CONFIG FAIL (NO SAFETY)', extra={'orderid': 'UNKNOWN'})
                return self.send_error(500)

            # verify ip in white list
            if self.request.remote_ip not in safety['white_list']:
                request_log.error("CONFIG FAIL ('%s'NOT IN WHITELIST)",
                                  self.request.remote_ip,
                                  extra={'orderid': 'UNKNOWN'})
                return self.send_error(500)

            # verify key
            tsp0 = self.request.headers['tsp']
            encrypted0 = self.request.headers['v']
            encrypted1 = signature(tsp0 + safety['secret'])

            if encrypted1 != encrypted0:
                request_log.error('CONFIG FAIL (SECRET FAIL)', extra={'orderid': 'UNKNOWN'})
                return self.send_error(500)

            # reload
            body = self.request.body.decode()
            request_log.debug(body, extra={'orderid': 'PRICING'})

            for line in body.split('\n'):

                if line.startswith('set '):
                    keys = line.split()
                    self.master.set(keys[1], keys[2])

                elif line.startswith('setex '):
                    keys = line.split()
                    if len(keys) < 3 or not keys[3].isdigit():
                        continue
                    self.master.setex(keys[1], int(keys[3]), keys[2])  # name time value

                elif line.startswith('hmset '):
                    keys = line.split()
                    mapping = {keys[x]: keys[x + 1] for x in range(2, len(keys), 2)}
                    self.master.hmset(keys[1], mapping)

                elif line.startswith('del '):
                    keys = line.split()
                    self.master.delete(keys[1])

                elif line.startswith('clr '):
                    keys = line.split()
                    keys = self.master.keys(keys[1])
                    for k in keys:
                        self.master.delete(k)

                elif line.startswith('incrby '):
                    keys = line.split()
                    if len(keys) < 3 or not keys[2].isdigit():
                        continue
                    self.master.incrby(keys[1], int(keys[2]))

            return self.finish()

        except Exception as e:
            request_log.exception('CONFIG SYNC FAIL', extra={'orderid': 'UNKNOWN'})

        self.send_error(500)
