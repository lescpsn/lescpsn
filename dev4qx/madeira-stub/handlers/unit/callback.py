import logging
import time
import tornado.gen
import tornado.web

request_log = logging.getLogger("madeira.request")


class CallbackHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(CallbackHandler, self).__init__(application, request)
        self.req_time = time.localtime()
        self.mobile = None
        self.user_id = None
        self.price = None
        self.sp_order_id = None
        self.back_url = None

    @tornado.gen.coroutine
    def post(self):
        body = self.request.body.decode()
        request_log.info('CALLBACK - %s', body)
