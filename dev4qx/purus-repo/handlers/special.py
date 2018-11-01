# -*- coding:utf-8 -*-
import json
import logging
import math
import tornado.gen
from datetime import datetime as dt
from sqlalchemy import and_

from db.repo import RepoSpecial, RepoProduct, RepoRouteSupply, RepoUser
from handlers import JsonHandler
from handlers.product import PRODUCT_TYPE, STATUS
from utils import escape

request_log = logging.getLogger('purus.request')

def escape_status(p_status, s_status):
    if p_status == 'disabled':
        if s_status == 'enabled':
            status = 'forced-enabled'
            status_n = '单用户开启'
        else:
            status = 'n/a'
            status_n = '默认关闭'
    else:
        if s_status == 'disabled':
            status = 'disabled'
            status_n = '上游维护'
        else:
            status = 'enabled'
            status_n = '正常'

    return status, status_n


class ApiSpecialHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        request_log.info('ApiSpecialHandler invoke method %s', path)
        if path == 'list':
            self.post_list_value()
            return
        elif path == 'list_product':
            self.post_list_product()
            return
        elif path == 'list_supply':
            self.post_list_supply()
            return
        elif path in ['add', 'update']:
            yield self.post_add_or_update()
            return
        elif path == 'batch_update':
            yield self.post_batch_update()
            return
        elif path == 'delete':
            yield self.post_delete()
            return
        self.send_error(404)

    @tornado.gen.coroutine
    def post_delete(self):
        domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id')
        product_id = self.json_args.get('product_id')
        mode = self.json_args.get('mode')

        session = self.session('repo')
        try:
            special = session.query(RepoSpecial).filter(RepoSpecial.user_id == user_id).filter(
                RepoSpecial.product_id == product_id).first()

            if special is None:
                self.finish(json.dumps({'status': 'fail'}))
                return

            if mode == 'value' or mode is None:
                special.value = None

            elif mode == 'supply':
                special.supply = None

            session.add(special)
            session.commit()
            self.finish(json.dumps({'status': 'ok'}))


            #yield core.sync_pricing(session, domain_id, filter_product=product_id, filter_user=user_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                  domain_id=domain_id, product_id=product_id, user_id=user_id))
        finally:
            session.close()

    @staticmethod
    def get_level(session, user_id):
        user = session.query(RepoUser).filter(RepoUser.user_id == user_id).one_or_none()
        if user and user.level in ['1', '2', '3', '4', '5']:
            return 'p' + user.level

    @tornado.gen.coroutine
    def post_add_or_update(self):
        domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id')
        product_id = self.json_args.get('product_id')
        value = self.json_args.get('value')
        status = self.json_args.get('status')
        supply = self.json_args.get('supply')
        notes = self.json_args.get('notes')

        session = self.session('repo')
        try:
            special = session.query(RepoSpecial).filter(RepoSpecial.user_id == user_id).filter(
                RepoSpecial.product_id == product_id).first()

            product = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id).filter(
                RepoProduct.product_id == product_id).one()

            is_new = False
            if special:
                if value:
                    special.value = value
                    special.update_value_time = dt.now()
                if status:
                    special.status = status
                    special.update_status_time = dt.now()
                if supply:
                    special.supply = supply
                    special.update_supply_time = dt.now()
                if notes:
                    special.notes = notes

                special.update_time = dt.now()

            else:
                special = RepoSpecial()
                special.user_id = user_id
                special.value = value
                special.status = status or product.status
                special.supply = supply
                special.notes = notes
                special.product_id = product_id
                special.update_time = dt.now()
                special.update_status_time = dt.now()
                special.update_supply_time = dt.now()
                special.update_value_time = dt.now()
                is_new = True

            session.add(special)
            session.commit()
            status, status_n = escape_status(product.status, special.status)
            data = {
                'id': product.product_id,
                'name': product.name,
                'type': product.type,
                'carrier': product.carrier,
                'price': product.price,
                'area': product.area,
                'use_area': product.use_area,
                'status': status,
                'p1': product.p1,
                'p2': product.p2,
                'p3': product.p3,
                'p4': product.p4,
                'p5': product.p5,
                'scope': product.scope,
                'legacy': product.legacy_id,
                'routing': product.routing,
                'type_n': PRODUCT_TYPE.get(product.type),
                'carrier_n': escape.escape_carrier(str(product.carrier)),
                'area_n': escape.escape_area(product.area),
                'use_area_n': escape.escape_area(product.use_area),
                'status_n': STATUS.get(status),
                'product_value': special.value,
                'user_id': special.user_id,
                'user_name': special.user_id,
                'product_id': product.product_id,
                'value': int(special.value or product.value),
                'tsp': str(special.update_time),
                'tsp_status': str(special.update_status_time),
                'tsp_supply': str(special.update_supply_time),
                'tsp_value': str(special.update_value_time),
                'notes': special.notes
            }

            self.finish(json.dumps({'status': 'ok', 'is_new': is_new, 'data': data}))

            # yield core.sync_pricing(session, domain_id, filter_product=product_id, filter_user=user_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                  domain_id=domain_id, product_id=product_id, user_id=user_id))

        except ValueError as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()

    def post_list_value(self):
        domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id', None)
        product_id = self.json_args.get('product_id', None)

        #新增加的密价搜索条件 type 为系统保留字，加个前缀
        product_type = self.json_args.get('type', None)
        carrier = self.json_args.get('carrier', None)
        price = self.json_args.get('price', None)
        value = self.json_args.get('value', None)
        area = self.json_args.get('area', None)
        use_area = self.json_args.get('use_area', None)
        name = self.json_args.get('name', None)
        status = self.json_args.get('status', None)
        page = int(self.json_args['page'])
        size = int(self.json_args['size'])
        session = self.session('repo')

        user_level = {}
        try:
            if user_id:
                # by-user
                q = session.query(RepoProduct, RepoSpecial).outerjoin(
                    RepoSpecial, and_(
                        RepoSpecial.product_id == RepoProduct.product_id,
                        RepoSpecial.user_id == user_id
                    )).filter(RepoProduct.domain_id == domain_id)
            else:
                q = session.query(RepoProduct, RepoSpecial).filter(RepoProduct.domain_id == domain_id).filter(
                    RepoSpecial.product_id == RepoProduct.product_id).filter(RepoSpecial.value >= 0)

            if product_type:
                q = q.filter(RepoProduct.type == product_type)

            if carrier:
                q = q.filter(RepoProduct.carrier == carrier)

            if price:
                q = q.filter(RepoProduct.price == price)

            if value:
                q = q.filter(RepoProduct.value == value)

            if area:
                q = q.filter(RepoProduct.area == area)

            if use_area:
                q = q.filter(RepoProduct.use_area == use_area)

            if name:
                q = q.filter( RepoProduct.name.like('%'+name+'%') )

            if status:
                q = q.filter(RepoProduct.status == status)

            if product_id:
                q = q.filter(RepoSpecial.product_id == product_id)

            count = q.count()
            max_page = int(math.ceil(count / size))

            product_list = []
            if user_id:
                q = q.order_by(RepoProduct.carrier, RepoProduct.area, RepoProduct.scope,
                               RepoProduct.value).offset((page - 1) * size).limit(size)
            else:
                q = q.order_by(RepoSpecial.user_id, RepoProduct.carrier, RepoProduct.area, RepoProduct.scope,
                               RepoProduct.value).offset((page - 1) * size).limit(size)

            for p, s in q:
                if s:
                    if s.user_id in user_level:
                        level = user_level.get(s.user_id)
                    else:
                        level = self.get_level(session, s.user_id)
                        user_level[s.user_id] = level
                elif user_id:
                    if user_id in user_level:
                        level = user_level.get(user_id)
                    else:
                        level = self.get_level(session, user_id)
                        user_level[user_id] = level

                product_list.append({
                    'id': p.product_id,
                    'name': p.name,
                    'type': p.type,
                    'carrier': p.carrier,
                    'price': p.price,
                    'area': p.area,
                    'use_area': p.use_area,
                    'status': p.status,
                    'p1': p.p1,
                    'p2': p.p2,
                    'p3': p.p3,
                    'p4': p.p4,
                    'p5': p.p5,
                    'scope': p.scope,
                    'legacy': p.legacy_id,
                    'routing': p.routing,
                    'type_n': PRODUCT_TYPE.get(p.type),
                    'carrier_n': escape.escape_carrier(str(p.carrier)),
                    'area_n': escape.escape_area(p.area),
                    'use_area_n': escape.escape_area(p.use_area),
                    'status_n': STATUS.get(p.status),
                    'product_value': getattr(p, level),
                    'user_id': s and s.user_id or user_id,
                    'user_name': s and s.user_id or user_id,
                    'product_id': p.product_id,
                    'value': s and s.value and int(s.value),
                    'tsp': s and s.update_time and str(s.update_time),
                    'tsp_status': s and s.update_status_time and str(s.update_status_time),
                    'tsp_supply': s and s.update_supply_time and str(s.update_supply_time),
                    'tsp_value': s and s.update_value_time and str(s.update_value_time),
                    'notes': s and s.notes,
                })

            self.finish(json.dumps({
                'status': 'success',
                'page': page,
                'max': max_page,
                'list': product_list
            }))

        finally:
            session.close()

    def post_list_product(self):
        domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id')

        filter_id = self.json_args.get('id')
        filter_price = self.json_args.get('price')
        filter_name = self.json_args.get('name')
        filter_type = self.json_args.get('type')
        filter_carrier = self.json_args.get('carrier')
        filter_area = self.json_args.get('area')
        filter_status = self.json_args.get('status')

        session = self.session('repo')

        try:
            q = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id)
            if filter_id:
                q = q.filter(RepoProduct.product_id.like('%'+filter_id+'%'))

            if filter_price:
                q = q.filter(RepoProduct.price == filter_price)

            if filter_name:
                q = q.filter(RepoProduct.name.like('%'+filter_name+'%'))

            if filter_type:
                q = q.filter(RepoProduct.type == filter_type)

            if filter_carrier:
                q = q.filter(RepoProduct.carrier == filter_carrier)

            if filter_area:
                q = q.filter(RepoProduct.area == filter_area)

            if filter_status:
                q = q.filter(RepoProduct.status == filter_status)

            count = q.count()

            page = int(self.json_args['page'])
            size = int(self.json_args['size'])

            max_page = int(math.ceil(count / size))

            product_list = []
            q = q.order_by(RepoProduct.carrier, RepoProduct.area, RepoProduct.scope, RepoProduct.value).offset(
                (page - 1) * size).limit(
                    size)

            # special status ...
#            enabled_set = set()
#            disabled_set = set()

            enabled_set = {}
            disabled_set = {}

            qs = session.query(RepoSpecial).filter(RepoSpecial.user_id == user_id).filter(
                RepoSpecial.status != None)

            for s in qs.all():
                if s.status == 'enabled':
#                    enabled_set.add(s.product_id)
                    enabled_set[s.product_id] = str(s.update_status_time)
                else:
#                    disabled_set.add(s.product_id)
                    disabled_set[s.product_id] = str(s.update_status_time)

            for p in q:
                if p.status == 'disabled':
                    if p.product_id in enabled_set:
                        status = 'forced-enabled'
                    else:
                        status = 'n/a'
                    tsp = enabled_set.get(p.product_id, None)
                else:
                    if p.product_id in disabled_set:
                        status = 'disabled'
                    else:
                        status = 'enabled'
                    tsp = disabled_set.get(p.product_id, None)

                product_list.append({
                    'id': p.product_id,
                    'name': p.name,
                    'type': p.type,
                    'carrier': p.carrier,
                    'price': p.price,
                    'area': p.area,
                    'use_area': p.use_area,
                    'status': status,
                    'value': p.value,
                    'notes': p.notes,
#                    'tsp': str(p.update_time),
                    'tsp': tsp,
                    'p1': p.p1,
                    'p2': p.p2,
                    'p3': p.p3,
                    'p4': p.p4,
                    'p5': p.p5,
                    'scope': p.scope,
                    'legacy': p.legacy_id,
                    'routing': p.routing,
                    'type_n': PRODUCT_TYPE.get(p.type),
                    'carrier_n': escape.escape_carrier(str(p.carrier)),
                    'area_n': escape.escape_area(p.area),
                    'use_area_n': escape.escape_area(p.use_area),
                    'status_n': STATUS.get(status),
                    'user_id': user_id,
                })

            self.finish(json.dumps({
                'status': 'ok',
                'page': page,
                'max': max_page,
                'list': product_list
            }))

        finally:
            session.close()

    def post_list_supply(self):
        domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id', None)
        product_id = self.json_args.get('product_id', None)
        area = self.json_args.get('area', None)
        carrier = self.json_args.get('carrier', None)

        page = int(self.json_args['page'])
        size = int(self.json_args['size'])

        session = self.session('repo')

        try:
            q = session.query(RepoSpecial, RepoProduct, RepoRouteSupply, RepoUser).filter(
                RepoProduct.domain_id == domain_id).filter(
                    RepoSpecial.product_id == RepoProduct.product_id).filter(
                        RepoSpecial.user_id == RepoUser.user_id).filter(
                            RepoSpecial.supply == RepoRouteSupply.id).filter(
                                RepoSpecial.supply != None)

            if area:
                q = q.filter(RepoProduct.area == area)

            if carrier:
                q = q.filter(RepoProduct.carrier == carrier)

            if user_id:
                q = q.filter(RepoSpecial.user_id == user_id)

            if product_id:
                q = q.filter(RepoSpecial.product_id == product_id)

            count = q.count()
            max_page = int(math.ceil(count / size))

            product_list = []
            q = q.order_by(RepoProduct.carrier, RepoProduct.area, RepoProduct.scope, RepoProduct.value).offset(
                (page - 1) * size).limit(
                    size)

            for sp, pr, su, ur in q:
                product_list.append({
                    'id': pr.product_id,
                    'name': pr.name,
                    'type': pr.type,
                    'carrier': pr.carrier,
                    'price': pr.price,
                    'area': pr.area,
                    'use_area': pr.use_area,
                    'status': pr.status,
                    'p1': pr.p1,
                    'p2': pr.p2,
                    'p3': pr.p3,
                    'p4': pr.p4,
                    'p5': pr.p5,
                    'scope': pr.scope,
                    'legacy': pr.legacy_id,
                    'routing': sp.supply,
                    'routing_n': su.name,
                    'type_n': PRODUCT_TYPE.get(pr.type),
                    'carrier_n': escape.escape_carrier(str(pr.carrier)),
                    'area_n': escape.escape_area(pr.area),
                    'use_area_n': escape.escape_area(pr.use_area),
                    'status_n': STATUS.get(pr.status),
                    'product_value': sp.value,
                    'user_id': sp.user_id,
                    'user_name': ur.name,
                    'product_id': pr.product_id,
                    'value': pr.value,
                    'tsp': str(sp.update_time),
                    'tsp_status': str(sp.update_status_time),
                    'tsp_supply': str(sp.update_supply_time),
                    'tsp_value': str(sp.update_value_time),
                    'notes': sp.notes
                })

            self.finish(json.dumps({
                'status': 'success',
                'page': page,
                'max': max_page,
                'list': product_list
            }))

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_batch_update(self):
        domain_id = self.json_args.get('domain_id')
        update_list = self.json_args.get('list')
        session = self.session('repo')
        try:
            discount = float(self.json_args.get('discount'))
            if discount < 0 or discount > 200:
                raise RuntimeError()

        except:
            self.finish(json.dumps({'status': 'fail', 'msg': 'DISCOUNT NOT DIGIT %s' % discount}))
            return

        result = {}
        for update in update_list:
            user_id = update.get('user_id')
            product_id = update.get('product_id')
            index = update.get('index')

            try:
                special = session.query(RepoSpecial).filter(RepoSpecial.user_id == user_id).filter(
                    RepoSpecial.product_id == product_id).one_or_none()

                if special is None:
                    continue

                product = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id).filter(
                    RepoProduct.product_id == product_id).one_or_none()

                special.value = int(product.price * discount * 100)
                special.update_time = dt.now()
                special.update_value_time = dt.now()
                session.add(special)
                session.commit()

                result[index] = special.value

                self.master.lpush('list:sync:pricing', '{domain_id},{product_id},{user_id}'.format(
                    domain_id=domain_id, product_id=product_id, user_id=user_id))

            except:
                request_log.exception('FAIL ON BATCH')

        self.finish(json.dumps({'status': 'ok', 'result': result}))
