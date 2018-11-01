# -*- coding: utf8 -*-
import hashlib

import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import JsonHandler


class AdminPricingHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self):
        downstream = self.application.config['downstream']

        user_list = [{'id': k, 'name': downstream[k]['name']} for k in downstream]
        user_list = sorted(user_list, key=lambda user: int(user['id']))

        package = [10, 20, 30, 50, 100, 200, 300, 500]
        area = ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏',
                '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西',
                '海南', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏',
                '新疆', '全国']

        self.render('admin_pricing.html', user_list=user_list, package=package, area=area, title=self.application.title)