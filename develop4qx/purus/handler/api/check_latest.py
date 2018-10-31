from handler import JsonHandler
import tornado.web
import tornado.gen

__author__ = 'Kevin'


class ApiChargeCheckHandler(JsonHandler):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):
        user_id = self.current_user['partner_id']
        prod = self.json_args['prod']
        number = self.json_args['number']

        charge_info = self.master.hmget('latest:%s' % user_id, ['prod', 'number'])

        if prod == charge_info[0] and number == charge_info[1]:
            return self.finish({'status': 'fail', 'msg': '您的上一笔订购为号码%s进行了相同规格的充值，您确认继续么?' % number})

        self.finish({'status': 'ok'})
