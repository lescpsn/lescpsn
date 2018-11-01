import tornado.web

from handler import BaseHandler

__author__ = 'Kevin'


class SpecialHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        if 'admin' not in self.current_user['roles']:
            return self.send_error(403)

        self.render('special.html', title=self.application.title)
