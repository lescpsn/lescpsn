import tornado
from handler.fuel_card import FuelCardJsonHandler
from _datetime import datetime
import logging
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from tornado import gen
import os
import json
import hashlib
from utils.encryption_decryption import aes_encrypt

log = logging.getLogger("purus.request")

class FuelCardBotAccountHandler(FuelCardJsonHandler):
    ACCOUNT_LIST = {}

    @gen.coroutine
    @tornado.web.authenticated
    def get(self):
        if not self.requ_type:
            if 'fuel-card-bot-account' not in self.current_user['roles']:
                return self.redirect('/auth/login')
            else:
                return self.render('fuel_card/bot_account.html', title=self.application.title)

        if self.requ_type == 'get_account_list':
            yield self.get_account_list()
            return

        return self.resp_json_result('fail', '未知请求' + self.requ_type)

    @gen.coroutine
    @tornado.web.authenticated
    def post(self):
        if 'fuel-card-bot-account' not in self.current_user['roles']:
            return self.send_error(404)

        if self.requ_type == 'add_account':
            yield self.add_account()
            return

        elif  self.requ_type == 'modify_password':
             yield self.modify_password()
             return

        elif  self.requ_type == 'modify_notes':
             yield self.modify_notes()
             return

        elif  self.requ_type == 'set_default_account':
             yield self.set_default_account()
             return

        elif  self.requ_type == 'del_account':
             yield self.del_account()
             return

        elif  self.requ_type == 'check_account':
             yield self.check_account()
             return

        return self.resp_json_result('fail', '未知请求')

    @gen.coroutine
    def get_account_list(self):
        url = self.application.config['connection']['repo']
        url += "/api/fuelcard/list"

        requ_data = {
            'domain_id': self.domain_id, 
            'user_id': self.user_id, 
        }

        account_list = []
        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler get_account_list REQU: {0}".format(requ_data))
            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            resp_data = yield http_client.fetch(request)
            resp_data = resp_data.body.decode()
            log.debug("FuelCardBotAccountHandler get_account_list RESP: {0}".format(resp_data))

            account_list = json.loads(resp_data)['list']

            self.save_account_list(account_list)
        except:
            log.exception("FuelCardBotAccountHandler add_account EXCEPTION")

        return self.resp_json_result('ok', '成功', {'account_list': account_list})

    def save_account_list(self,account_list):
        self.ACCOUNT_LIST[self.user_id] = {}
        for account_info in account_list:
            self.ACCOUNT_LIST[self.user_id][account_info['account']] = account_info

    def get_account_password(self,account):
        if self.ACCOUNT_LIST.get(self.user_id):
             if self.ACCOUNT_LIST[self.user_id].get(account):
                return self.ACCOUNT_LIST[self.user_id].get(account).get('password')
        return None

    @gen.coroutine
    def add_account(self):
        account = self.argu_list['account'].strip()
        password  = self.argu_list['password'].strip()
        password = hashlib.sha1(password.encode()).hexdigest()
        notes  = self.argu_list['notes']

        url = self.application.config['connection']['repo']
        url += "/api/fuelcard/add"

        requ_data = {
            'domain_id': self.domain_id, 
            'user_id': self.user_id, 
            'account': account, 
            'password': password, 
            'notes': notes, 
        }
        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler add_account REQU: {0}".format(requ_data))

            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("FuelCardBotAccountHandler add_account RESP: {0}".format(resp_data))

            if resp_data['status'] == 'ok':
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail',resp_data['msg'])
        except:
            log.exception("FuelCardBotAccountHandler add_account EXCEPTION")

        return self.resp_json_result('fail', '未知错误')


    @gen.coroutine
    def modify_password(self):
        account = self.argu_list['account'].strip()
        password  = self.argu_list['password'].strip()
        password = hashlib.sha1(password.encode()).hexdigest()
        
        url = self.application.config['connection']['repo']
        url += "/api/fuelcard/update"

        requ_data = {
            'domain_id': self.domain_id, 
            'user_id': self.user_id, 
            'account': account, 
            'password': password, 
        }
        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler modify_password REQU: {0}".format(requ_data))

            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("FuelCardBotAccountHandler modify_password RESP: {0}".format(resp_data))

            if resp_data['status'] == 'ok':
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail',resp_data['msg'])
        except:
            log.exception("FuelCardBotAccountHandler modify_password EXCEPTION")

        return self.resp_json_result('fail', '未知错误')

    @gen.coroutine
    def modify_notes(self):
        account = self.argu_list['account'].strip()
        notes  = self.argu_list['notes']
        
        url = self.application.config['connection']['repo']
        url += "/api/fuelcard/update"

        requ_data = {
            'domain_id': self.domain_id, 
            'user_id': self.user_id, 
            'account': account, 
            'notes': notes,
        }
        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler modify_notes REQU: {0}".format(requ_data))

            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("FuelCardBotAccountHandler modify_notes RESP: {0}".format(resp_data))

            if resp_data['status'] == 'ok':
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail',resp_data['msg'])
        except:
            log.exception("FuelCardBotAccountHandler modify_notes EXCEPTION")

        return self.resp_json_result('fail', '未知错误')

    @gen.coroutine
    def set_default_account(self):
        account = self.argu_list['account'].strip()
        
        url = self.application.config['connection']['repo']
        url += "/api/fuelcard/default"

        requ_data = {
            'domain_id': self.domain_id, 
            'user_id': self.user_id, 
            'account': account, 
        }
        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler set_default_account REQU: {0}".format(requ_data))

            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("FuelCardBotAccountHandler set_default_account RESP: {0}".format(resp_data))

            if resp_data['status'] == 'ok':
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail',resp_data['msg'])
        except:
            log.exception("FuelCardBotAccountHandler set_default_account EXCEPTION")

        return self.resp_json_result('fail', '未知错误')

    @gen.coroutine
    def del_account(self):
        account = self.argu_list['account'].strip()
        
        url = self.application.config['connection']['repo']
        url += "/api/fuelcard/delete"

        requ_data = {
            'domain_id': self.domain_id, 
            'user_id': self.user_id, 
            'account': account, 
        }
        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler del_account REQU: {0}".format(requ_data))

            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("FuelCardBotAccountHandler del_account RESP: {0}".format(resp_data))

            if resp_data['status'] == 'ok':
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail',resp_data['msg'])
        except:
            log.exception("FuelCardBotAccountHandler del_account EXCEPTION")

        return self.resp_json_result('fail', '未知错误')


    @gen.coroutine
    def check_account(self):
        account = self.argu_list['account'].strip()
        password = self.get_account_password(account)

        if not password:
            return self.resp_json_result('fail', '找不到该账号的信息')

        requ_data = {
            'username': account,
            'password': password,
        }

        dostream_info = self.application.config['downstream'][self.user_id]
        aes_key = dostream_info['pass']
        aes_iv = dostream_info['iv']
        code = aes_encrypt(json.dumps(requ_data), aes_key, aes_iv)
        body = {'code': code}
        
        url = self.application.config['connection']['modem_port']
        url += '/verify_login'

        try:
            http_client = AsyncHTTPClient()
            log.debug("FuelCardBotAccountHandler check_account REQU: {0}".format(requ_data))

            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )

            log.debug("FuelCardBotAccountHandler check_account RESP: {0}".format(resp_data))

            return self.finish(response.body)
        except:
            log.exception("check_account EXCEPTION")
            return self.resp_json_result('fail', '内部异常')


