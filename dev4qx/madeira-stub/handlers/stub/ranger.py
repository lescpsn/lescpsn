import logging

import tornado
import tornado.web

request_log = logging.getLogger("madeira.request")


class RangerProxyHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        ref_id = self.request.headers.get('RefId')

        request_log.info('RANGER %s - %s', ref_id, self.request.body.decode())
        self.finish('9999')
