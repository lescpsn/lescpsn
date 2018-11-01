import json
import logging

from handler import BaseHandler
import tornado

log = logging.getLogger("purus.request")

class FuelCardBaseHandler(BaseHandler):
    def __init__(self, application, request, **kwargs):
        super(FuelCardBaseHandler, self).__init__(application, request)

class FuelCardJsonHandler(FuelCardBaseHandler):
    def __init__(self, application, request, **kwargs):
        super(FuelCardJsonHandler, self).__init__(application, request)

    def resp_json_result(self, status, msg,data=None):
        resp_data = {'status':status, 'msg':msg, 'data':data}
        #log.info("RESP: {0}".format(resp_data))

        resp_data = json.dumps(resp_data)
        return self.finish(resp_data)

    @tornado.web.authenticated
    def prepare(self):
        if self.request.method == 'GET':
            if 'fuel-card' not in self.current_user['roles']:
                return self.redirect('/auth/login')

            #log.info("GET: {0} {1}".format(self.request.uri, self.request.arguments))
            args = {}
            for argument in self.request.arguments:
                if argument != 'requ_type':
                    args[argument] = self.get_argument(argument)

            self.args = args
            self.requ_type = self.get_argument('requ_type', None)
            self.argu_list = args

        elif self.request.method == 'POST':
            if 'fuel-card' not in self.current_user['roles']:
                return self.resp_json_result('fail', '权限验证失败')

            requ_body = self.request.body.decode()
            #log.info("POST: {0} {1}".format(self.request.uri, requ_body))
            args = json.loads( requ_body )

            self.args = args
            self.requ_type = args['requ_type']
            self.argu_list = args.get('argu_list', {})

        self.domain_id  = self.current_user['domain_id']
        self.user_id  = self.current_user['partner_id']