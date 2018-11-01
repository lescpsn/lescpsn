# -*- coding:utf-8 -*-

import json
import logging
import tornado.gen
import core
from db.repo import RepoRouteSupply, RepoRouteInterface
from handlers import JsonHandler
from utils import escape
from sqlalchemy.sql import and_

request_log = logging.getLogger('purus.request')

ADAPT_FLAG = {
    'yes': '是',
    'no': '否'
}

STATUS_FLAG = {
    'enabled': '正常',
    'disabled': '删除'
}

def escape_inf(inf_list, interface_map):
    name = []
    for inf in inf_list:
        name.append(interface_map.get(inf, inf))

    return ','.join(name)


class ApiRouteSupplyHandler(JsonHandler):
    @tornado.gen.coroutine
    def get(self, path):
        if path == 'list':
            self.get_supply_list()
            return

    def get_supply_list(self):
        domain_id = self.get_argument('domain_id')
        supply_list = list()
        interface_list = list()
        interface_map = {}
        session = self.session('repo')
        try:
            q = session.query(RepoRouteInterface).filter(RepoRouteInterface.domain_id == domain_id)

            for inf in q.all():
                interface_map[inf.interface_id] = inf.name

                interface_list.append({
                    'id': inf.interface_id,
                    'name': inf.name
                })

            q = session.query(RepoRouteSupply).filter(and_(RepoRouteSupply.domain_id == domain_id, RepoRouteSupply.status == 'enabled')).order_by(
                RepoRouteSupply.id)
            for supply in q.all():
                backup_map = {}
                inf_list = supply.interfaces.split(',')
                if supply.backup:
                    for backup in supply.backup.split(','):
                        inf1, inf2 = backup.split('=>')
                        backup_map[inf1] = inf2

                request_log.debug(inf_list)
                request_log.debug(backup_map)
                supply_list.append({
                    'id': supply.id,
                    'name': supply.name,
                    'area': supply.area,
                    'area_n': escape.escape_area(supply.area),
                    'adapt_flag': supply.adapt_flag,
                    'adapt_flag_n': ADAPT_FLAG.get(supply.adapt_flag, supply.adapt_flag),
                    'restriction': supply.restriction,
                    'interfaces': inf_list,
                    'interfaces_n': escape_inf(inf_list, interface_map),
                    'backup_map': backup_map,
                    'status': supply.status,
                    'status_n': STATUS_FLAG.get(supply.status, supply.status),
                    'create_date': str(supply.create_time),
                    'update_date': str(supply.update_time),
                })

        except:
            request_log.exception('LIST SUPPLY FAIL')

        finally:
            session.close()

        resp = json.dumps({
            'status': 'ok',
            'supply_list': supply_list,
            'interface_list': interface_list
        })

        self.finish(resp)

    @tornado.gen.coroutine
    def post(self, path):
        if path == 'save_update':
            yield self.post_supply_save_update()
            return
        elif path == 'delete':
            yield self.post_supply_delete()
            return

    @tornado.gen.coroutine
    def post_supply_save_update(self):
        domain_id = self.json_args.get('domain_id')
        supply_id = self.json_args.get('id')

        name = self.json_args.get('name')
        area = self.json_args.get('area')
        restriction = self.json_args.get('restriction')
        adapt_flag = self.json_args.get('adapt_flag')
        interfaces = self.json_args.get('interfaces')
        backup_map = self.json_args.get('backup_map')
        status = self.json_args.get('status')

        notes = self.json_args.get('notes')

        session = self.session('repo')

        backup_keys = filter(lambda x: x in interfaces and backup_map[x], backup_map.keys())
        backup_list = ['%s=>%s' % (inf1, backup_map[inf1]) for inf1 in backup_keys]

        try:
            if interfaces:
                interfaces = list(set(interfaces))

            if supply_id:
                # update
                supply = session.query(RepoRouteSupply).filter(RepoRouteSupply.domain_id == domain_id).filter(
                    RepoRouteSupply.id == supply_id).one()

                if name:
                    supply.name = name
                if area:
                    supply.area = area
                if adapt_flag:
                    supply.adapt_flag = adapt_flag
                if restriction:
                    supply.restriction = restriction
                if interfaces:
                    supply.interfaces = ','.join(sorted(interfaces))
                if backup_list:
                    supply.backup = ','.join(sorted(backup_list))
                if status:
                    supply.status = status
                if notes:
                    supply.notes = notes

                session.add(supply)
                session.commit()

            else:
                # update
                supply = RepoRouteSupply()
                supply.domain_id = domain_id

                supply.name = name
                supply.area = area
                supply.adapt_flag = adapt_flag or 'no'
                supply.restriction = restriction
                supply.interfaces = ','.join(sorted(interfaces))
                supply.backup = ','.join(sorted(backup_list))
                supply.status = status
                supply.notes = notes

                session.add(supply)
                session.commit()

            self.finish({
                'status': 'ok',
                'data': {
                    'id': supply.id,
                    'name': supply.name,
                    'area': supply.area,
                    'area_n': escape.escape_area(supply.area),
                    'create_date': str(supply.create_time),
                    'update_date': str(supply.update_time),
                }
            })

            # full sync, should be slow...
            # yield core.sync_pricing(session, domain_id)
            self.master.lpush('list:sync:pricing',
                              '{domain_id},{product_id},{user_id}'.format(
                                  domain_id=domain_id, product_id='', user_id=''))

        except Exception as e:
            request_log.exception('SUPPLY DETAIL FAIL')
            self.finish({'status': 'fail'})

        finally:
            # session.rollback()
            session.close()

    @tornado.gen.coroutine
    def post_supply_delete(self):
        domain_id = self.json_args.get('domain_id')
        supply_id = self.json_args.get('id')
        session = self.session('repo')
        try:
            session.query(RepoRouteSupply).filter(
                RepoRouteSupply.domain_id == domain_id).filter(
                    RepoRouteSupply.id == supply_id).update({'status' : 'disabled'})
            session.commit()
            self.finish({
                'status': 'ok',
            })
        except Exception as e:
            request_log.exception('SUPPLY DETAIL FAIL')
            self.finish({'status': 'fail'})

        finally:
            # session.rollback()
            session.close()
