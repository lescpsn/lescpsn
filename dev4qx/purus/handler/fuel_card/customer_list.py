import tornado
from handler.fuel_card import FuelCardJsonHandler
from db.purus import FuelCardCustomer, FuelCardCardVerifyRecord
import logging
from _datetime import datetime
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import json
from utils.encryption_decryption import aes_encrypt

log = logging.getLogger("purus.request")

class FuelCardCustomerListHandler(FuelCardJsonHandler):
    @tornado.web.authenticated
    def get(self):
        if not self.requ_type:
            if 'fuel-card-customer-list' not in self.current_user['roles']:
                return self.redirect('/auth/login')
            else:
                return self.render('fuel_card/customer_list.html', title=self.application.title)
        elif self.requ_type == 'get_customer_list':
            return self.get_customer_list()

        return self.resp_json_result('fail','未知请求')

    @tornado.web.authenticated
    @gen.coroutine
    def post(self):
        if 'fuel-card-customer-list' not in self.current_user['roles']:
            return self.send_error(404)

        if self.requ_type == 'add_customer':
            return self.add_customer()
        elif self.requ_type == 'del_customer':
            return self.del_customer()
        elif self.requ_type == 'check_card_account_step1':
             yield self.check_card_account_step1()
             return
        elif self.requ_type == 'check_card_account_step2':
             yield self.check_card_account_step2()
             return

        elif self.requ_type == 'modify_notes':
            return self.modify_notes()
             
        elif self.requ_type == 'modify_name':
            return self.modify_name()

        return self.resp_json_result('fail','未知请求')

    def get_customer_list(self):
        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(FuelCardCustomer).filter(FuelCardCustomer.user_id == self.user_id).order_by(FuelCardCustomer.id)
            customer_list = []
            for customer in q.all():
                verify_time = None
                if customer.verify_time:
                    verify_time = customer.verify_time.strftime("%Y-%m-%d %H:%M:%S")

                customer_info = {
                    'card_id': customer.card_id,
                    'name': customer.name,
                    'notes': customer.notes,
                    'verify_info': customer.verify_info,
                    'verify_time': verify_time,
                    'update_time': customer.update_time.strftime("%Y-%m-%d %H:%M:%S"),
                }
                customer_list.append(customer_info)
            
            return self.resp_json_result('ok','成功', {'customer_list': customer_list} )
        except:
            log.exception('get_customer_list EXCEPTION!!!')
        finally:
            self.db_session.close()

    def add_customer(self):
        user_id = self.user_id
        card_id = self.argu_list['card_id'].strip()
        name = self.argu_list['name']
        notes = self.argu_list['notes']
        create_time = datetime.now()
        update_time = create_time

        try:
            self.db_session = self.session('purus')
            customer = FuelCardCustomer()
            customer.user_id = user_id
            customer.card_id = card_id
            customer.name = name
            customer.notes = notes
            customer.create_time = create_time
            customer.update_time = update_time

            self.db_session.add(customer)
            self.db_session.commit()
            return self.resp_json_result('ok','成功')
        except:
            log.exception("add_customer EXCEPTION: user_id={0} customer={1} ".format(self.user_id, self.argu_list))
            return self.resp_json_result('fail','添加失败')
        finally:
            self.db_session.close()


    def del_customer(self):
        card_id = self.argu_list['card_id']
        try:
            self.db_session = self.session('purus')
            self.db_session.query(FuelCardCustomer).filter(FuelCardCustomer.user_id == self.user_id, FuelCardCustomer.card_id == card_id).delete()
            self.db_session.commit()
            return self.resp_json_result('ok','成功')
        except:
            log.exception("del_customer EXCEPTION: user_id={0} card_id={1}".format(self.user_id, card_id))
            return self.resp_json_result('fail','删除失败')
        finally:
            self.db_session.close()

    @gen.coroutine
    def check_card_account_step1(self):
        check_id = self.argu_list['check_id']
        card_id = self.argu_list['card_id'].strip()
        mobile = self.argu_list['mobile']

        check_key = "map:check_info:{0}:{1}".format(self.user_id, check_id)
        self.master.hmset(check_key,{'card_id': card_id,'mobile': mobile,})
        self.master.expire(check_key,5*60)

        requ_data = {
            'check_id': check_id,
            'card_id': card_id,
            'mobile': mobile,
        }

        dostream_info = self.application.config['downstream'][self.user_id]

        aes_key = dostream_info['pass']
        aes_iv = dostream_info['iv']
        code = aes_encrypt(json.dumps(requ_data), aes_key, aes_iv)
        body = {'code': code}
        
        url = self.application.config['connection']['modem_port']
        url += '/verify_card_account_step1'

        try:
            log.debug("{0} check_card_account_step1 REQU: {1}".format(check_id, body))
            http_client = AsyncHTTPClient()
            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("{0} check_card_account_step1 RESP: {1}".format(check_id, resp_data))

            if resp_data['status'] == 'ok':
                return self.resp_json_result('ok', '成功')
            else:
                error_msg = ''
                if 'data' in resp_data:
                    error_msg = resp_data['data'].get('error_msg', '')
                    if error_msg:
                        self.save_check_info(card_id, error_msg=error_msg)

                return self.resp_json_result('fail',resp_data['msg'] + " " + error_msg)
        except:
            log.exception("{0} check_card_account_step1 EXCEPTION".format(check_id))
            return self.resp_json_result('fail', '内部异常')

    @gen.coroutine
    def check_card_account_step2(self):
        check_id = self.argu_list['check_id']
        mobile_yzm = self.argu_list['mobile_yzm']

        check_key = "map:check_info:{0}:{1}".format(self.user_id, check_id)
        check_info = self.master.hgetall(check_key)

        if not check_info:
            pass
            #return self.resp_json_result('fail', '找不到相关记录，无法继续!!!')

        requ_data = {
            'check_id': check_id,
            'mobile_yzm': mobile_yzm,
        }

        dostream_info = self.application.config['downstream'][self.user_id]

        aes_key = dostream_info['pass']
        aes_iv = dostream_info['iv']
        code = aes_encrypt(json.dumps(requ_data), aes_key, aes_iv)
        body = {'code': code}
        
        url = self.application.config['connection']['modem_port']
        url += '/verify_card_account_step2'

        try:
            http_client = AsyncHTTPClient()
            log.debug("{0} check_card_account_step2 REQU: {1}".format(check_id, code))
            request = HTTPRequest(url=url, method="POST", body=json.dumps(requ_data))
            response = yield http_client.fetch(request)

            resp_data = json.loads( response.body.decode() )
            log.debug("{0} check_card_account_step2 RESP: {1}".format(check_id, resp_data))

            if resp_data['status'] == 'ok':
                name = ""
                if 'data' in resp_data:
                    verify_data = resp_data['data'].get('verify_data')
                    if verify_data:
                        name = verify_data['cardInfo']['cardHolder']
                        self.save_check_info(check_info['card_id'], verify_data=verify_data)
                        
                self.master.delete(check_key)
                return self.resp_json_result('ok', '成功', {'name':name})
            else:
                error_msg = ""
                if 'data' in resp_data:
                    error_msg = resp_data['data'].get('error_msg')
                    if not error_msg: error_msg = ""

                return self.resp_json_result('fail',resp_data['msg'] + " " + error_msg)
        except:
            log.exception("{0} check_card_account_step2 EXCEPTION".format(check_id))
            return self.resp_json_result('fail', '内部异常')

    def save_check_info(self, card_id, verify_data=None, error_msg=None):
        try:
            self.db_session = self.session('purus')
            verify_record = FuelCardCardVerifyRecord()
            verify_record.user_id = self.user_id
            verify_record.card_id = card_id
            verify_record.verify_time = datetime.now()
            if verify_data:
                verify_record.verify_data = json.dumps(verify_data)
            else:
                verify_record.verify_data = verify_data

            if error_msg:
                verify_record.error_msg = error_msg
            else:
                verify_record.error_msg = error_msg

            self.db_session.merge(verify_record)
            self.db_session.commit()

            verify_info = error_msg
            if verify_data:
                verify_info = verify_data['cardInfo']['cardHolder']

            if verify_info:
                customer_list = self.db_session.query(FuelCardCustomer).filter(FuelCardCustomer.card_id == card_id).all()
                for customer in customer_list:
                    customer.verify_info = verify_info
                    customer.verify_time = datetime.now()
                self.db_session.commit()
        except:
            log.exception("save_check_info EXCEPTION")
        finally:
            self.db_session.close()


    def modify_notes(self):
        card_id = self.argu_list['card_id'].strip()
        notes  = self.argu_list['notes']

        try:
            self.db_session = self.session('purus')
            customer = self.db_session.query(FuelCardCustomer).filter(FuelCardCustomer.user_id == self.user_id, FuelCardCustomer.card_id == card_id).one()
            if customer:
                customer.notes = notes
                customer.update_time = datetime.now()
                self.db_session.commit()
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail', '客户信息不存在')
        except:
            log.exception("modify_notes EXCEPTION")
            return self.resp_json_result('fail', '内部异常')
        finally:
            self.db_session.close()


    def modify_name(self):
        card_id = self.argu_list['card_id'].strip()
        name  = self.argu_list['name'].strip()

        try:
            self.db_session = self.session('purus')
            customer = self.db_session.query(FuelCardCustomer).filter(FuelCardCustomer.user_id == self.user_id, FuelCardCustomer.card_id == card_id).one()
            if customer:
                customer.name = name
                customer.update_time = datetime.now()
                self.db_session.commit()
                return self.resp_json_result('ok', '成功')
            else:
                return self.resp_json_result('fail', '客户信息不存在')
        except:
            log.exception("modify_name EXCEPTION")
            return self.resp_json_result('fail', '内部异常')
        finally:
            self.db_session.close()