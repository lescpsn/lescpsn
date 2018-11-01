# encoding: utf8
from datetime import datetime
import json
import tornado.gen
import tornado.ioloop
import core

from db.fuelcard import FuelAccount
from db.repo import RepoUser
from handlers import JsonHandler

STATUS_MAP = {
    'valid': '有效',
    'invalid': '失效'
}


class ApiFuelCardHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        if path == 'list':
            yield self.post_list()
            return
        elif path in ['add', 'update', 'delete']:
            yield self.post_add_or_update(path)
            return
        if path == 'default':
            yield self.post_default()
            return

    @tornado.gen.coroutine
    def post_list(self):
        domain_id = self.json_args.get('domain_id')

        user_id = self.json_args.get('user_id')

        session = self.session('repo')

        try:
            account_list = []
            q = session.query(FuelAccount).filter(FuelAccount.domain_id == domain_id).filter(
                FuelAccount.user_id == user_id).filter(FuelAccount.status != 'deleted')

            for acct in q.all():
                account_list.append({
                    'id': acct.id,
                    'account': acct.account,
                    'create_time': str(acct.create_time),
                    'update_time': str(acct.update_time or acct.create_time),
                    'password': acct.password,
                    'default': acct.is_default is not None,
                    'status': acct.status,
                    'status_n': STATUS_MAP.get(acct.status, ''),
                    'notes': acct.notes,
                })

            self.finish(json.dumps({'status': 'ok', 'list': account_list}))

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_add_or_update(self, mode):
        domain_id = self.json_args.get('domain_id')

        user_id = self.json_args.get('user_id')
        account = self.json_args.get('account')
        password = self.json_args.get('password')
        is_default = self.json_args.get('default')
        notes = self.json_args.get('notes')
        status = self.json_args.get('status')

        session = self.session('repo')

        try:
            fuel_account = session.query(FuelAccount).filter(FuelAccount.account == account).filter(
                FuelAccount.status != 'deleted').first()

            if status and status not in STATUS_MAP:
                raise RuntimeError('无效的状态')

            if mode == 'add':
                if fuel_account:
                    raise RuntimeError('系统中存在重复账号')
            elif mode in ['update', 'delete']:
                if not fuel_account:
                    raise RuntimeError('未找到需要修改的账号')
                if fuel_account.user_id != user_id:
                    raise RuntimeError('账号与用户不一致')

            if mode == 'add':
                fuel_account = FuelAccount()
                fuel_account.domain_id = domain_id
                fuel_account.user_id = user_id
                fuel_account.account = account
                fuel_account.password = password
                fuel_account.is_default = is_default
                fuel_account.notes = notes
                fuel_account.status = status or 'valid'
                fuel_account.create_time = datetime.now()

            if mode == 'update':
                if password:
                    fuel_account.password = password
                if notes:
                    fuel_account.notes = notes
                if status:
                    fuel_account.status = status
                fuel_account.update_time = datetime.now()

            if mode == 'delete':
                fuel_account.status = 'deleted'
                fuel_account.is_default = None
                fuel_account.update_time = datetime.now()

            session.add(fuel_account)
            session.commit()

            self.finish(json.dumps({'status': 'ok'}))

            tornado.ioloop.IOLoop.instance().add_callback(core.sync_user, session, domain_id)

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_default(self):

        domain_id = self.json_args.get('domain_id')

        user_id = self.json_args.get('user_id')
        account = self.json_args.get('account')

        session = self.session('repo')

        try:
            q = session.query(FuelAccount).filter(FuelAccount.user_id == user_id)

            for acct in q.all():
                if acct.account == account:
                    acct.is_default = 'True'
                else:
                    acct.is_default = None

            session.commit()

            self.finish(json.dumps({'status': 'ok'}))

            tornado.ioloop.IOLoop.instance().add_callback(core.sync_user, session, domain_id)

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()

    @tornado.gen.coroutine
    def sync_account(self, domain_id):
        # found forrestal services
        # sync domain - user - account (w/h password)

        session = self.session('repo')
        try:
            q = session.query(RepoUser).filter(RepoUser.domain_id == domain_id)

            for user in q.all():
                pass

            session.commit()

            self.finish(json.dumps({'status': 'ok'}))

        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))

        finally:
            session.close()

        pass
