from handler import BaseHandler

import tornado.web

__author__ = 'Kevin'


class DownstreamHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self, path):
        if 'admin' not in self.current_user['roles']:
            return self.send_error(404)

        if path == 'approval':
            self.render('ds-approval.html', title=self.application.title)
        elif path == 'management':
            self.render('ds-management.html', title=self.application.title)
        elif path == 'admin':
            self.render('ds-admin.html', title=self.application.title)
        else:
            self.send_error(404)