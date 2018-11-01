# -*- coding: utf-8 -*-
import json
import logging

from tornado import gen
import tornado.ioloop
import tornado.httpserver
import tornado.web
import redis

from db.purus import Routing
from handler import JsonHandler
from utils.escape import escape_carrier, escape_area

request_log = logging.getLogger("purus.request")


class AdminRoutingHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self, path):
        if 'admin-routing' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        downstream = self.application.config['downstream']

        user_list = []
        for k in downstream:
            if k[0] == '2' or k == '100001':
                user_list.append({'id': k, 'name': downstream[k]['name']})

        user_list = sorted(user_list, key=lambda user: int(user['id']))

        self.render('admin_routing.html', user_list=user_list, title=self.application.title)

    @gen.coroutine
    @tornado.web.authenticated
    def post(self, path):
        if 'admin-routing' not in self.current_user['roles']:
            self.finish()
            return

        if path == '/all':
            user_id = self.json_args.get('user_id')
            carrier = self.json_args.get('carrier')
            area = self.json_args.get('area')
            price = self.json_args.get('price')

            cfg = self.application.config['madeira']
            r = redis.Redis(host=cfg['ip'], port=cfg['port'], db=cfg['db'], decode_responses=True)

            routing_list = []
            try:
                session = self.session('purus')
                q = session.query(Routing).filter(
                    Routing.carrier == carrier)

                if user_id:
                    q = q.filter(Routing.user_id == user_id)

                if price:
                    q = q.filter(Routing.price == price)

                if area:
                    q = q.filter(Routing.area == area)

                q = q.order_by(Routing.user_id, Routing.area, Routing.price)

                for routing in q.all():
                    k = 'route:{user_id}:fee:{carrier}:{area}:{price}'.format(
                        user_id=routing.user_id,
                        carrier=routing.carrier,
                        area=routing.area,
                        price=routing.price)

                    v = r.get(k)

                    request_log.info('GET %s = %s', k, v)

                    if v is None:
                        status = 'OFF'
                    elif v == routing.routing:
                        status = 'ON'
                    else:
                        status = 'UNKNOWN(%s)' % v

                    carrier_name = escape_carrier(str(routing.carrier))
                    area_name = escape_area(routing.area)
                    routing_list.append({'id': routing.id,
                                         'user_id': routing.user_id,
                                         'carrier': carrier_name,
                                         'area': area_name,
                                         'price': routing.price,
                                         'routing': routing.routing,
                                         'status': status})

                session.close()

                self.finish(json.dumps({'status': 'ok', 'routing': routing_list}))
            except Exception as e:
                self.finish(json.dumps({'status': 'fail', 'msg': repr(e)}))

        elif path == '/set':
            routing_id = self.json_args['id']
            func = self.json_args['func']

            cfg = self.application.config['madeira']
            r = redis.Redis(host=cfg['ip'], port=cfg['port'], db=cfg['db'], decode_responses=True)

            try:

                session = self.session('purus')
                routing = session.query(Routing).filter(Routing.id == routing_id).one()
                session.close()

                k = 'route:{user_id}:fee:{carrier}:{area}:{price}'.format(
                    user_id=routing.user_id,
                    carrier=routing.carrier,
                    area=routing.area,
                    price=routing.price)

                if func == 'ON':
                    request_log.debug('SET %s %s' % (k, routing.routing))
                    r.set(k, routing.routing)
                elif func == 'OFF':
                    request_log.debug('DEL %s' % k)
                    r.delete(k)

                self.finish(json.dumps({'status': 'ok'}))
            except Exception as e:
                self.finish(json.dumps({'status': 'fail', 'msg': repr(e)}))

        elif path == '/setall':
            user_id = self.json_args.get('user_id')
            carrier = self.json_args.get('carrier')
            price = self.json_args.get('price')
            area = self.json_args.get('area')
            func = self.json_args['func']

            cfg = self.application.config['madeira']
            r = redis.Redis(host=cfg['ip'], port=cfg['port'], db=cfg['db'], decode_responses=True)

            try:
                session = self.session('purus')
                q = session.query(Routing).filter(Routing.carrier == carrier)

                if user_id:
                    q = q.filter(Routing.user_id == user_id)

                if area:
                    q = q.filter(Routing.area == area)

                if price:
                    q = q.filter(Routing.price == price)

                q = q.order_by(Routing.user_id, Routing.area, Routing.price)

                for routing in q.all():
                    k = 'route:{user_id}:fee:{carrier}:{area}:{price}'.format(
                        user_id=routing.user_id,
                        carrier=routing.carrier,
                        area=routing.area,
                        price=routing.price)

                    if func == 'ON':
                        request_log.debug('SET %s %s' % (k, routing.routing))
                        r.set(k, routing.routing)
                    elif func == 'OFF':
                        request_log.debug('DEL %s' % k)
                        r.delete(k)

                session.close()

                self.finish(json.dumps({'status': 'ok'}))
            except Exception as e:
                self.finish(json.dumps({'status': 'fail', 'msg': repr(e)}))

        else:
            self.finish('')
