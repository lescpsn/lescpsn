import logging
import tornado.gen
import tornado.web

request_log = logging.getLogger("madeira.request")

BLOCK_SIZE = 16


class UnitToolsHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, path):
        if path == 'clean_order':
            self.get_clean_order()

    def get_clean_order(self):
        master_target = self.application.sentinel.master_for('madeira', db=1)
        all_order_ids = master_target.keys('order:Q*')
        for key in all_order_ids:
            master_target.delete(key)

        master_target.delete('list:error')
        master_target.delete('list:finish')
        master_target.delete('list:create')
        master_target.delete('list:save')

        master_test = self.application.sentinel.master_for('madeira', db=3)
        master_test.delete('list:result')
