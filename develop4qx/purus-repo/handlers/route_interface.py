# -*- coding: utf-8 -*-

import json
import logging
import tornado.gen
from sqlalchemy import desc, asc
from db.repo import RepoRouteInterface, RepoInterfacePrice, RepoProduct
from handlers import JsonHandler
from utils import escape
from datetime import datetime as dt

request_log = logging.getLogger('purus.request')

def escape_carrier(carrier_str):
    carrier_list = []
    for carrier in carrier_str.split(','):
        carrier_list.append(escape.escape_carrier(carrier))

    return ', '.join(carrier_list)


class ApiRouteInterfaceHandler(JsonHandler):
    
    @tornado.gen.coroutine
    def get(self, path):
        if path == 'list':
            self.get_interface_list()
            return

    def get_interface_list(self):
        domain_id = self.get_argument('domain_id')
        interface_list = list()
        session = self.session('repo')
        try:
            q = session.query(RepoRouteInterface).filter(RepoRouteInterface.domain_id == domain_id)
            for i in q.all():
                interface_list.append({
                    'id': i.interface_id,
                    'name': i.name,
                })
        except:
            request_log.exception('LIST INTERFACE FAIL')

        finally:
            session.close()

        resp = json.dumps({'status': 'ok', 'data': interface_list})
        self.finish(resp)
        print(resp)
                
    @tornado.gen.coroutine
    def post(self, path):
        if path == 'price':
            self.post_interface_price()
            return
        elif path == 'price/modify':
            self.post_interface_price_modify()
        elif path == 'list':
            self.post_interface_list()
        elif path == 'price/add':
            self.post_interface_price_add()
        elif path == 'price/remove':
            self.post_interface_price_remove()
        elif path == 'score':
            self.post_interface_score()

    def post_interface_list(self):
        domain_id = self.json_args.get('domain_id')
        sort_by = self.json_args.get('sort_by')
        is_desc = self.json_args.get('desc')
        score_limit = self.json_args.get('limit')

        request_log.debug('SORT BY %s %s', sort_by, is_desc)

        interface_list = list()
        session = self.session('repo')

        try:
            sort_func = is_desc and desc or asc
            q = session.query(RepoRouteInterface).filter(RepoRouteInterface.domain_id == domain_id)

            if score_limit:
                q = q.filter(RepoRouteInterface.score >= score_limit)
                request_log.info('FILTER BY SCORE>=%d', score_limit)

            if sort_by == 'id':
                q = q.order_by(sort_func(RepoRouteInterface.interface_id))
            elif sort_by == 'score':
                q = q.order_by(sort_func(RepoRouteInterface.score), RepoRouteInterface.interface_id)
            elif sort_by == 'create_time':
                q = q.order_by(sort_func(RepoRouteInterface.create_time), RepoRouteInterface.interface_id)
            else:
                q = q.order_by(RepoRouteInterface.carrier, RepoRouteInterface.interface_id)

            for i in q.all():
                interface_list.append({
                    'id': i.interface_id,
                    'name': i.name,
                    'score': i.score,
                    'carrier': escape_carrier(i.carrier),
                    'area': escape.escape_area(i.area),
                    'create_time': str(i.create_time),
                })

        except:
            request_log.exception('LIST INTERFACE FAIL')

        finally:
            session.close()

        resp = json.dumps({'status': 'ok', 'list': interface_list})
        self.finish(resp)
    def post_interface_price_add(self):
        domain_id = self.json_args.get('domain_id')
        interface_id = self.json_args.get('interface_id')
        product_id = self.json_args.get('product_id')
        value =  float(self.json_args.get('value'))*10000
        session = self.session('repo')
        try:
            interfacePrice = RepoInterfacePrice()
            q = session.query(RepoInterfacePrice).filter(
                RepoInterfacePrice.domain_id == domain_id).filter(
                    RepoInterfacePrice.interface_id == interface_id).filter(
                    RepoInterfacePrice.product_id == product_id)
            if not q.all():          
                interfacePrice.domain_id = domain_id
                interfacePrice.interface_id = interface_id
                interfacePrice.product_id = product_id
                interfacePrice.value = value
                interfacePrice.score = value
                interfacePrice.create_time = dt.now()
                session.add(interfacePrice)
                session.commit()
        except:
            request_log.exception('ADD INTERFACE PRICE FAIL')
        finally:
            session.close()
            
            
        resp = json.dumps({'status': 'ok'})
        self.finish(resp)

    def post_interface_price_remove(self):
        id = self.json_args.get('id')
        session = self.session('repo')
        
        try:
            session.query(RepoInterfacePrice).filter(RepoInterfacePrice.id == id).delete()
            session.commit()
        except:
            request_log.exception('REMOVE INTERFACE PRICE FAIL')
        finally:
            session.close()
                    
        resp = json.dumps({'status': 'ok'})
        self.finish(resp)        

    def post_interface_price(self):
        domain_id = self.json_args.get('domain_id')
        interface_id = self.json_args.get('interface_id')
        carrier = self.json_args.get('carrier')
        price_list = list()
        session = self.session('repo')
        try:
            q = session.query(RepoInterfacePrice, RepoProduct).filter(
                RepoInterfacePrice.product_id == RepoProduct.product_id).filter(
                    RepoInterfacePrice.domain_id == domain_id).filter(
                        RepoInterfacePrice.interface_id == interface_id)

            if carrier:
                q = q.filter(RepoProduct.carrier == carrier)
                request_log.info('FILTER CARRIER %s', carrier)

            q = q.order_by(RepoInterfacePrice.product_id)
            for price, product in q.all():
                price_list.append({
                    'id': price.id,
                    'product_id': price.product_id,
                    'product_name': product.name,
                    'value': '%.3f' % (price.value / 10000),
                    'score': '%d' % price.score,
                    'discount': '%.2f' % (price.value / product.price / 100)
                })
        except:
            request_log.exception('LIST INTERFACE FAIL')
        finally:
            session.close()

        resp = json.dumps({'status': 'ok', 'list': price_list})
        self.finish(resp)

    def post_interface_price_modify(self):
        domain_id = self.json_args.get('domain_id')
#        interface_id = self.json_args.get('interface_id')
        score = self.json_args.get('score')
        value = self.json_args.get('value')
        id_ = self.json_args.get('id')
        session = self.session('repo')
        try:
            q = session.query(RepoInterfacePrice).filter(
                RepoInterfacePrice.domain_id == domain_id).filter(
                    RepoInterfacePrice.id == id_)
            p = q.one_or_none()
            if value :
                value = int(float(value)*10000)
                if p.value == p.score:
                    update_field = {
                        'value' : value,
                        'score' : value
                    }
                else:
                    update_field = {
                        'value' : value
                    }
            elif score :
                    update_field = {
                        'score' : score
                    }

            session.query(RepoInterfacePrice).filter(
                RepoInterfacePrice.domain_id == domain_id).filter(
                    RepoInterfacePrice.id == id_).update(
                       update_field)


            session.commit()
        except:
            request_log.exception('UPDATE PRICE FAIL')

        finally:
            session.close()

        resp = json.dumps({'status': 'ok'})
        self.finish(resp)

    def post_interface_score(self):
        domain_id = self.json_args.get('domain_id')
        interface_id = self.json_args.get('interface_id')
        score = self.json_args.get('score')
        session = self.session('repo')
        try:
            session.query(RepoRouteInterface).filter(
                RepoRouteInterface.domain_id == domain_id).filter(
                    RepoRouteInterface.interface_id == interface_id).update(
                        {'score' : score})
            session.commit()
        except:
            request_log.exception('UPDATE SCORE FAIL')

        finally:
            session.close()

        resp = json.dumps({'status': 'ok'})
        self.finish(resp)
