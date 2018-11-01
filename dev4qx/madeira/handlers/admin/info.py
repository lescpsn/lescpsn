import json
import logging
import os

import yaml

from handlers import BaseHandler

request_log = logging.getLogger("madeira.request")


class InfoHandler(BaseHandler):
    def get(self):

        safety = self.application.config.get('safety')

        if safety is None:
            request_log.error('CONFIG FAIL (NO SAFETY)', extra={'orderid': 'ORDER_INFO'})
            return self.send_error(500)

        # verify ip in white list
        if self.request.remote_ip not in safety['white_list']:
            request_log.error("ORDER_INFO FAIL ('%s'NOT IN WHITELIST)",
                              self.request.remote_ip,
                              extra={'orderid': 'CONFIG'})
            return self.send_error(500)

        order_id = self.get_argument('order_id')

        order_info = self.slave.hgetall('order:' + order_id)

        self.finish(json.dumps(order_info))
