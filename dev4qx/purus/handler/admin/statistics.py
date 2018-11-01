import json
import logging
from tornado.httpclient import AsyncHTTPClient
import tornado.web
import tornado.gen

from handler import BaseHandler
from utils.escape import escape_upstream, escape_carrier, escape_area

__author__ = 'Kevin'

request_log = logging.getLogger("purus.request")

ORDER_MAP = {
    'cmcc-1': '1',  # 广东移动
    'cmcc-ha-1': '2',  # 河南移动
    'cmcc-sn-1': '3',  # 陕西移动
    'xicheng-1': '4',  # 西城移动
    '21cn-leliu-3': '5',  # 21cn 电信
    'xicheng-3': '6',  # 西城电信
    'xicheng-2': '7',  # 西城联通
}


def decode_key(key, interface_map):
    inf, carrier, area = key.split(':')
    inf_carrier = inf + '-' + carrier

    inf_name = []
    for _inf in inf.split('+'):
        inf_name.append(interface_map.get(_inf, _inf))

    carrier = escape_carrier(carrier)
    area = escape_area(area)

    return '+'.join(inf_name), carrier, area, inf_carrier


class AdminStatisticsHandler(BaseHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request)

        self.stat_url = self.application.config['connection']['stat']

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def get(self, path):
        if path == '/profiles':
            profile_list = []

            client = AsyncHTTPClient()
            try:
                url = self.stat_url + '/stats/profiles'
                response = yield client.fetch(url)

                profile_list = json.loads(response.body.decode())
            finally:
                client.close()

            self.finish(json.dumps(profile_list))

        else:
            self.render('admin/statistics.html', title=self.application.title)

    @tornado.gen.coroutine
    def post(self, path):
        args = json.loads(self.request.body.decode())

        profile_id = args.get('profile')
        stat_map = {}
        stat_list = []

        client = AsyncHTTPClient()

        try:
            url = self.stat_url + ('/stats/%s' % profile_id)
            response = yield client.fetch(url)

            body = response.body.decode()
            p = json.loads(body)
            # request_log.debug('BODY %s' % json.dumps(p, indent=2))

            up_map = p.get('stat')

            interface_map = self.application.config.get('interface')

            for key in up_map:
                inf, carrier, area, inf_carrier = decode_key(key, interface_map)
                success, fail, processing, total = up_map.get(key)

                stat = stat_map.get(inf_carrier)
                if stat is None:
                    stat = {'key': inf_carrier, 'name': inf + '-' + carrier, 'stat': []}
                    stat_map[inf_carrier] = stat

                stat['stat'].append({
                    'inf': inf,
                    'carrier': carrier,
                    'area': area,
                    's': success,
                    'f': fail,
                    'p': processing,
                    't': total
                })

            for k in stat_map:
                s = stat_map[k]
                s['stat'] = sorted(s['stat'], key=lambda s: '%5d%5d' % (s['t'], s['p']), reverse=True)
                stat_list.append(s)

            stat_list = sorted(stat_list, key=lambda s: ORDER_MAP.get(s['key'], '9'))
            profile = {'stat_list': stat_list}

        except:
            request_log.exception('EXCEPTION ON PROFILE %s' % profile_id)
            profile = {'stat': []}

        finally:
            client.close()

        body = json.dumps(profile)
        self.finish(body)
