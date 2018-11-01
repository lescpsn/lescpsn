# -*- coding: utf8 -*-

import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import JsonHandler


class AddFundHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self):
        self.render('add_fund.html', title=self.application.title)
