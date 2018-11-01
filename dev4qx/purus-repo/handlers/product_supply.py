from datetime import datetime as dt
import json
import logging
import tornado.gen
import math
import core

from db.repo import RepoRouteSupply, RepoProduct
from handlers import JsonHandler
from handlers.product import PRODUCT_TYPE, STATUS
from utils import escape

request_log = logging.getLogger('purus.request')


class ApiProductSupplyHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        if path == 'list':
            self.post_product_supply_list()
            return
        elif path == 'update':
            yield self.post_product_supply_update()
            return

    def post_product_supply_list(self):
        domain_id = self.json_args.get('domain_id')

        product_list = list()
        supply_list = list()

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
            #
            supply_map = {}
            q = session.query(RepoRouteSupply).filter(RepoRouteSupply.domain_id == domain_id).order_by(
                    RepoRouteSupply.id)

            for supply in q.all():
                supply_map[str(supply.id)] = supply.name

                supply_list.append({
                    'id': supply.id,
                    'name': supply.name
                })

            q = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id)

            if filter_id:
                q = q.filter(RepoProduct.product_id == filter_id)

            if filter_price:
                q = q.filter(RepoProduct.price == filter_price)

            if filter_name:
                q = q.filter(RepoProduct.name == filter_name)

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

            q = q.order_by(RepoProduct.carrier, RepoProduct.area, RepoProduct.scope, RepoProduct.value).offset(
                    (page - 1) * size).limit(
                    size)

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
                    'routing_n': supply_map.get(p.routing, '(无效的货源)'),
                    'type_n': PRODUCT_TYPE.get(p.type),
                    'carrier_n': escape.escape_carrier(str(p.carrier)),
                    'area_n': escape.escape_area(p.area),
                    'use_area_n': escape.escape_area(p.use_area),
                    'status_n': STATUS.get(p.status),
                })

            resp = json.dumps({
                'status': 'success',
                'page': page,
                'max': max_page,
                'product': product_list,
                'supply': supply_list
            })
        except:
            request_log.exception('LIST PRODUCT-SUPPLY FAIL')
            resp = json.dumps({'status': 'fail'})
        finally:
            session.close()

        self.finish(resp)

    @tornado.gen.coroutine
    def post_product_supply_update(self):

        domain_id = self.json_args.get('domain_id')

        product_id = self.json_args.get('product_id')
        supply_id = self.json_args.get('supply_id')

        session = self.session('repo')

        try:
            supply = session.query(RepoRouteSupply).filter(RepoRouteSupply.domain_id == domain_id).filter(
                    RepoRouteSupply.id == supply_id).first()

            if supply is None:
                self.finish({'status': 'fail', 'msg': '无效的货源'})
                return

            product = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id).filter(
                    RepoProduct.product_id == product_id).one()

            product.routing = supply_id
            product.update_time = dt.now()

            session.add(product)
            session.commit()

            self.finish({
                'status': 'ok',
                'routing': supply_id,
                'routing_n': supply.name,
            })

            # yield core.sync_pricing(session, domain_id, filter_product=product_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                      domain_id=domain_id, product_id=product_id, user_id=''))

        except Exception as e:
            request_log.exception('SUPPLY DETAIL FAIL')
            self.finish({'status': 'fail'})

        finally:
            # session.rollback()
            session.close()
