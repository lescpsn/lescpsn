from handler import BaseHandler

import tornado.web

__author__ = 'Kevin'


class ProductHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        if 'admin' not in self.current_user['roles']:
            return self.send_error(403)

        self.render('product.html', title=self.application.title)


class ProductUserHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        if 'admin' not in self.current_user['roles']:
            return self.send_error(403)

        self.render('product_user.html', title=self.application.title)
