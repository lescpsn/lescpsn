# encoding: utf-8
import logging
import tornado.gen
import tornado.ioloop
from sqlalchemy.orm import sessionmaker

import core

request_log = logging.getLogger("purus.request")


class SyncTask(tornado.ioloop.PeriodicCallback):
    def __init__(self, application, callback_time):
        super(SyncTask, self).__init__(self.do_sync, callback_time)
        self.application = application
        self.master = self.application.sentinel.master_for('madeira')
        self.in_sync = False

    def session(self, name):
        if name in self.application.engine:
            engine = self.application.engine[name]
            return sessionmaker(bind=engine)()
        return None

    @tornado.gen.coroutine
    def do_sync(self):
        if self.in_sync:
            return

        if self.master.exists('flag:task'):
            request_log.info('STOP FLAG FOUND!')
            return

        if not self.master.exists('list:sync:pricing'):
            return

        session = self.session('repo')

        try:
            self.in_sync = True

            sync_list = []
            full_sync_set = set()
            line = self.master.lpop('list:sync:pricing')

            while line:
                request_log.info('SYNC LINE {%s}', line)
                domain_id, product_id, user_id = line.split(',')
                if product_id == '' and user_id == '':
                    full_sync_set.add(domain_id)

                sync_list.append((domain_id, product_id, user_id))
                line = self.master.lpop('list:sync:pricing')

            # TODO: merge same, remove
            for domain_id in full_sync_set:
                request_log.info('SYNC FULL DOMAIN {%s}', domain_id)
                sync_list = list(filter(lambda x: x[0] != domain_id, sync_list))
                sync_list.append((domain_id, '', ''))

            for domain_id, product_id, user_id in sync_list:
                yield core.sync_pricing(session, domain_id, filter_product=product_id, filter_user=user_id)

        except:
            request_log.exception('SYNC FAIL')

        finally:
            self.in_sync = False
            session.close()
