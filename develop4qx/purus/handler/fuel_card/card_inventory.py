import logging
import tornado.web,tornado.gen
from handler.fuel_card import FuelCardJsonHandler
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from urllib.parse import urlencode

log = logging.getLogger("purus.request")

class CardInventoryHandler(FuelCardJsonHandler):

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def get(self):

        if self.requ_type == 'get_user_inventory':
            yield self.get_user_inventory()
            return

        return self.resp_json_result('fail','未知请求')


    @tornado.gen.coroutine
    def get_user_inventory(self):
        http_client = AsyncHTTPClient()
        try:
            requ_dict = {
                'requ_type': 'get_user_inventory',
                'user_id': self.user_id,
                'card_type': self.argu_list['card_type'],
            }
            requ_data = urlencode(requ_dict)
            url = '{0}/api/inventory?{1}'.format(self.application.config['connection']['truman'],requ_data)
            http_requ = HTTPRequest(url=url, method='GET', request_timeout=120)
            resp = yield  http_client.fetch(http_requ)
            return self.finish(resp.body.decode())
        except:
            log.exception('get_user_inventory EXCEPTION!!!')
            return self.resp_json_result('fail','未知异常')

