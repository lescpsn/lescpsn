# encoding: utf8
import json
import logging
import math
import tornado.gen

from db.repo import RepoProduct, RepoLevel, RepoDomain
from handlers import JsonHandler
from utils import escape

PRODUCT_TYPE = {
    'data': '流量',
    'fee': '话费'
}

STATUS = {
    'enabled': '正常',
    'disabled': '维护',
    'n/a': '上游维护',
    'forced-enabled': '强制开启'
}

request_log = logging.getLogger('purus.request')


class ApiProductHandler(JsonHandler):
    def get(self, path):
        if path == 'list_level':
            self.get_list_level()
            return
        if path == 'list':
            self.get_list()
            return

        self.send_error(404)

    def get_list(self):
        domain_id = self.get_argument('domain_id')

        session = self.session('repo')
        try:
            product_list = []
            q = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id).order_by(
                    RepoProduct.carrier, RepoProduct.area, RepoProduct.scope, RepoProduct.value).all()

            for p in q:
                product_list.append({
                    'id': p.product_id,
                    'name': p.name,
                    'type': p.type,
                    'carrier': p.carrier,
                    'price': p.price,
                    'area': p.area,
                    'use_area': p.use_area,
                    'status': p.status,
                    'value': p.value,
                    'notes': p.notes,
                    'tsp': str(p.update_time),
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
                })

            self.finish(json.dumps(product_list))

        finally:
            session.close()

    def get_list_level(self):
        domain_id = self.get_argument('domain_id')

        session = self.session('repo')
        try:
            name_list = []
            q = session.query(RepoLevel).filter(RepoLevel.domain_id == domain_id).order_by(RepoLevel.level).all()
            for l in q:
                name_list.append(l.name)

            self.finish(json.dumps(name_list))

        finally:
            session.close()

    @tornado.gen.coroutine
    def post(self, path):
        if path == 'list':
            self.post_list()
            return
        elif path == 'set_level':
            self.post_set_level()
            return
        elif path == 'update':
            yield self.post_update()
            return
        elif path == 'sync':
            yield self.post_sync()
            return

    @tornado.gen.coroutine
    def post_sync(self):
        domain_id = self.json_args.get('domain_id')
        user_id = self.json_args.get('user_id', '')
        session = self.session('repo')

        request_log.info('FILTER USER=%s', user_id)
        try:
            # yield sync_pricing(session, domain_id, filter_user=user_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                      domain_id=domain_id, product_id='', user_id=user_id))
            self.finish(json.dumps({'status': 'ok', 'msg': 'SUCCESS'}))

        finally:
            session.close()

    def post_set_level(self):
        domain_id = self.json_args.get('domain_id')
        level_name = self.json_args.get('level_name')

        session = self.session('repo')
        try:
            level_map = {}
            for l in session.query(RepoLevel).filter(RepoLevel.domain_id == domain_id).all():
                level_map[l.level] = l

            for i in range(len(level_name)):
                level = level_map.get(str(i + 1))
                if level:
                    level.name = level_name[i]
                    session.add(level)

            session.commit()
            self.finish({'status': 'ok', 'msg': 'SUCCESS'})

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_update(self):
        domain_id = self.json_args.get('domain_id')

        product_id = self.json_args.get('id')
        value = self.json_args.get('value', None)
        status = self.json_args.get('status', None)

        p1 = self.json_args.get('p1', None)
        p2 = self.json_args.get('p2', None)
        p3 = self.json_args.get('p3', None)
        p4 = self.json_args.get('p4', None)
        p5 = self.json_args.get('p5', None)

        session = self.session('repo')
        try:
            q = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id).filter(
                    RepoProduct.product_id == product_id)

            product = q.first()

            if product is None:
                raise ValueError('NOT FOUND')

            if value:
                product.value = value

            if status:
                product.status = status

            if p1:
                product.p1 = p1
            if p2:
                product.p2 = p2
            if p3:
                product.p3 = p3
            if p4:
                product.p4 = p4
            if p5:
                product.p5 = p5

            session.add(product)
            session.commit()

            self.finish(json.dumps({
                'status': 'ok',
                'msg': 'update',
                'product': {
                    'id': product.product_id,
                    'name': product.name,
                    'type': product.type,
                    'carrier': product.carrier,
                    'price': product.price,
                    'area': product.area,
                    'use_area': product.use_area,
                    'status': product.status,
                    'value': product.value,
                    'notes': product.notes,
                    'tsp': str(product.update_time),
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
                    'status_n': STATUS.get(product.status),
                }
            }))

            # yield core.sync_pricing(session, domain_id, filter_product=product_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                      domain_id=domain_id, product_id=product_id, user_id=''))

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()

    def post_list(self):
        domain_id = self.json_args.get('domain_id')
        up_domain_id = self.json_args.get('up_domain_id')

        filter_id = self.json_args.get('id', None)
        filter_price = self.json_args.get('price', None)
        filter_name = self.json_args.get('name', None)
        filter_type = self.json_args.get('type', None)
        filter_carrier = self.json_args.get('carrier', None)
        filter_area = self.json_args.get('area', None)
        filter_status = self.json_args.get('status', None)

        page = int(self.json_args['page'])
        size = int(self.json_args['size'])

        session = self.session('repo')

        try:
            if up_domain_id:
                up_domain = session.query(RepoDomain).filter(RepoDomain.domain_id == domain_id).filter(
                        RepoDomain.up_domain == up_domain_id).first()

                if up_domain is None:
                    raise RuntimeError('CANNOT FOUND %s <= %s' % (domain_id, up_domain_id))

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
            max_page = int(math.ceil(count / size))

            product_list = []
            q = q.order_by(RepoProduct.carrier, RepoProduct.area, RepoProduct.scope, RepoProduct.value).offset(
                    (page - 1) * size).limit(
                    size)

            for p in q.all():
                product_list.append({
                    'id': p.product_id,
                    'name': p.name,
                    'type': p.type,
                    'carrier': p.carrier,
                    'price': p.price,
                    'area': p.area,
                    'use_area': p.use_area,
                    'status': p.status,
                    'value': p.value,
                    'notes': p.notes,
                    'tsp': str(p.update_time),
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
                })

            self.finish(json.dumps({
                'status': 'success',
                'page': page,
                'max': max_page,
                'list': product_list
            }))

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()
