# -*- coding: utf8 -*-
import json
import logging

import tornado.ioloop
import tornado.httpserver
import tornado.web

log = logging.getLogger("request")

class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(BaseHandler, self).__init__(application, request)

class JsonHandler(BaseHandler):
    def __init__(self, application, request, **kwargs):
        super(JsonHandler, self).__init__(application, request)

    def resp_json_result(self, status, msg,data=None):
        resp_data = {'status': status, 'msg': msg, 'data': data}
        log.info('RESP {0}'.format(resp_data) )

        resp_data = json.dumps(resp_data)
        return self.finish(resp_data)

    def prepare(self):
        if self.request.method == 'GET':
            self.args = {}
            for argument in self.request.arguments:
                if argument != 'requ_type':
                    self.args[argument] = json.loads(self.get_argument(argument))

            self.requ_type = self.get_argument('requ_type', None)
            self.argu_list = self.args

        elif self.request.method == 'POST':
            requ_body = self.request.body.decode()
            self.args = json.loads( requ_body )

            self.requ_type = self.args['requ_type']
            self.argu_list = self.args.get('argu_list', {})