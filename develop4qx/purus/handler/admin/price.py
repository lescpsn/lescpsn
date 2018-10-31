import tornado.web

from handler import BaseHandler

__author__ = 'Kevin'


class PriceHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        if 'admin' not in self.current_user['roles']:
            return self.send_error(404)

        self.render('price.html', title=self.application.title)
