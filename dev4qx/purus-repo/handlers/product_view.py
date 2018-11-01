#-*- coding:utf-8 -*-

from datetime import datetime as dt
import json
import logging
import tornado.gen
import math
import core
from db.repo import RepoRouteSupply, RepoProduct, RepoProductCatalog, RepoSpecial,RepoUser
from handlers import JsonHandler
from handlers.product import PRODUCT_TYPE, STATUS
from utils import escape
from sqlalchemy import or_, and_

request_log = logging.getLogger('purus.request')

class ApiProductViewHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        if path == 'list':
            self.post_product_view_list()
            return
        if path == 'catalog':
            self.post_product_catalog_list()
            return

    def post_product_view_list(self):

        admin_flag = self.json_args.get('admin_flag')
        domain_id = self.json_args.get('domain_id')
        product_name = self.json_args.get('productcatalog')
        user_id = self.json_args.get('userid')
        status = self.json_args.get('status')
        route_name = self.json_args.get('route')
        #route_name = 'suopai'
        carrier = self.json_args.get('carrier')
        page = int(self.json_args['page'])
        size = int(self.json_args['size'])

        request_log.debug('''request argumets:
        domain_id={domain_id},
        user_id={user_id},
        product_name={product_name},
        status={status},
        route_name={route_name},
        carrier={carrier}
        '''.format(domain_id=domain_id,user_id=user_id, product_name=product_name,
                   status=status, route_name=route_name,
                   carrier=carrier
        ))

        session = self.session('repo')
        try:
            # 通过接口名查出对应的接口id(可能是多个)
            # 保存在route_info={id，interfaces}字典中

            if route_name:
                q = session.query(RepoRouteSupply).filter(
                    or_( RepoRouteSupply.interfaces.like('%'+','+route_name+'%'),
                         RepoRouteSupply.interfaces.like('%'+','+route_name+','+'%'),
                         RepoRouteSupply.interfaces.like('%'+route_name+','+'%'),
                         RepoRouteSupply.interfaces == route_name)
                    )
            else:
                q = session.query(RepoRouteSupply)
            route_info={}
            routing_id_t=()
            for p in q.all():
                split_interface = p.interfaces.split(',')
                split_interface_dic=dict(zip(list(range(len(split_interface))),split_interface))
                route_info[str(p.id)] = split_interface_dic
                #route_info[str(p.id)] = p.interfaces
                routing_id_t += (p.id,)

            # mysql数据库中没有对应的接口直接退出
            if not routing_id_t:
                self.finish(json.dumps({'status': 'fail', 'data': ''}))
                session.close()
                return

            request_log.debug("{0} contain routing id {1}".format(route_name,route_info))

            if user_id:
                level = session.query(RepoUser).filter(RepoUser.user_id == user_id).first().level
                pl = 'p'+level

            q = session.query(RepoProduct, RepoSpecial).outerjoin(
                RepoSpecial, RepoSpecial.product_id == RepoProduct.product_id
                ).filter(RepoProduct.domain_id == domain_id)

            if routing_id_t:
                q = q.filter(RepoProduct.routing.in_(routing_id_t))

            if product_name:
                q = q.filter(RepoProduct.catalog_id == product_name
                ).filter(RepoProduct.catalog_id != None)
            else:
                q = q.filter(RepoProduct.catalog_id != None)

            if carrier:
                q = q.filter(RepoProduct.carrier == carrier)

            max_page = int(math.ceil(q.count() / size))
            tmp_list = []
            line_record_dict={}
            price_dict={}
            value_pre_dict={}
            price_str=""
            value_pre_str=""
            kg=True
            s_flag=0
            for p,s in q.all():
                #print("*****:",p,s,level)
                #continue
                key=p.catalog_id+"_"+user_id+"_"+p.routing+"_"+p.carrier
                if key not in price_dict.keys():
                    price_dict[key] = []
                    value_pre_dict[key] = []

                if s is None:
                    status_time = str(p.update_time)
                    supply_time = str(p.update_time)
                    value = eval("p.p%s"%level)
                else:
                    status_time = str(s.update_status_time or p.update_time)
                    supply_time = str(s.update_supply_time or p.update_time)
                    value = s.value if s.value else eval("p.p%s"%level)
                    if s_flag==0:
                        value = eval("p.p%s"%level)
                    if user_id==s.user_id and s.status=='enabled':
                        value = s.value if s.value else eval("p.p%s"%level)
                        if s_flag==0:
                            price_dict[key] = []
                            value_pre_dict[key] = []
                        price_dict[key].append(p.price)
                        price_str = ','.join(list(map(str, sorted(list(set(price_dict[key]))))))
                        value_pre_dict[key].append('{0}'.format("%.1f%%" % (value/(p.price*100.0))) )
                        value_pre_str = ','.join(list(map(str, sorted(list(set(value_pre_dict[key]))))))
                        s_flag=1

                if s_flag==0:
                    #print("p:",p,s)
                    price_dict[key].append(p.price)
                    price_str = ','.join(list(map(str, sorted(list(set(price_dict[key]))))))
                    value_pre_dict[key].append('{0}'.format("%.1f%%" % (value/(p.price*100.0))) )
                    value_pre_str = ','.join(list(map(str, sorted(list(set(value_pre_dict[key]))))))
                if not admin_flag:
                    value_pre_str=''
                line_record_dict[key]={
                        'user_id': user_id,
                        'catalog_id': p.catalog_id,
                        'carrier': p.carrier,
                        'cn_tag': 1 if p.catalog_id in ('MCN', 'UCN', 'CCN') else 0,
                        'price': price_str,
                        'status': 'None',
                        'status_time': status_time,
                        'supply_time': supply_time,
                        'value': value_pre_str,
                        'routing': route_info.get(p.routing) 
                }
            tmp_list=list(line_record_dict.values())
            print(tmp_list)
            self.finish(json.dumps({'status': 'ok', 'page': page, 'max': max_page, 'data': tmp_list}))

        except Exception as e:
            request_log.exception('QUERY PRODUCT FAIL',e)
            self.finish(json.dumps({'status': 'fail', 'data': ''}))

        finally:
            session.close()


    def post_product_catalog_list(self):
        domain_id = self.json_args.get('domain_id')
        session = self.session('repo')
        try:
            q = session.query(RepoProductCatalog).filter(RepoProductCatalog.domain_id == domain_id)
            product_catalog_list = []
            for p in q.all():
                product_catalog_list.append({
                    'catalog_id': p.catalog_id,
                    'name': p.name,
                    })
            self.finish(json.dumps({'status': 'ok', 'data': product_catalog_list}))

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'data': str(e)}))

        finally:
            session.close()
