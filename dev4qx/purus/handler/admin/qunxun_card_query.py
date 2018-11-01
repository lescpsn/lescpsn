from tornado import web, gen
from handler import BaseHandler


class AdminQuxunCardQueryHandler(BaseHandler):
    @gen.coroutine
    @web.authenticated
    def get(self):
        if 'admin-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')


        self.render('quxun_admin_card_query.html', title=self.application.title)

