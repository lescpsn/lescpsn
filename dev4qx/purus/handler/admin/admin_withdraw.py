import json
import logging
import math
import time
from datetime import datetime

import tornado
from sqlalchemy import desc
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

from db.purus import WithdrawRecord, WithdrawRecord2
from handler import JsonHandler2

log = logging.getLogger("purus.request")


@tornado.gen.coroutine
def get_user_bank_info(user_id,repo_url):
    bank_user_name = ''
    bank_account = ''
    bank_of_deposit = ''
    try:
        http_client = AsyncHTTPClient()
        body = json.dumps({'user_id': user_id})
        url = '{0}/api/user/by_id'.format(repo_url)
        response = yield http_client.fetch(url, method='POST', body=body)
        resp_data = json.loads(response.body.decode())
        bank_user_name = resp_data['data']['account_name']
        bank_account = resp_data['data']['account_number']
        bank_of_deposit = resp_data['data']['account_bank']
    except:
        log.exception('get_user_bank_info EXCEPTION')

    return bank_user_name,bank_account,bank_of_deposit

class AdminWithdrawHandler(JsonHandler2):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def get(self):
        if 'admin-withdraw' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if self.requ_type == None:
            return self.render('admin_withdraw.html',  title=self.application.title)

        if self.requ_type == 'get_withdraw_record':
            return self.get_withdraw_record()

        return self.resp_json_result('fail', '未知请求')

    @tornado.gen.coroutine
    @tornado.web.authenticated
    def post(self):
        if 'admin-withdraw' not in self.current_user['roles']:
            return self.resp_json_result('fail', '鉴权失败')

        if self.requ_type == 'start_withdraw':
             yield self.start_withdraw()
             return
        elif self.requ_type == 'set_withdraw_fail':
             yield self.set_withdraw_fail()
             return
        elif self.requ_type == 'set_withdraw_success':
            yield self.set_withdraw_success()
            return
        elif self.requ_type == 'change_user_notes':
            return self.change_user_notes()
        elif self.requ_type == 'upload_withdraw_img':
            return self.upload_withdraw_img()

        return self.resp_json_result('fail', '未知请求')


    def get_withdraw_record(self):
        page_info = None

        record_list = []
        db_session = self.session('purus')
        try:
            query = db_session.query(WithdrawRecord)

            if 'withdraw_id' in self.argu_list and self.argu_list['withdraw_id'] != '':
                query = query.filter(WithdrawRecord.withdraw_id == self.argu_list['withdraw_id'])

            if 'bank_user_name' in self.argu_list and self.argu_list['bank_user_name'] != '':
                query = query.filter(WithdrawRecord.bank_user_name == self.argu_list['bank_user_name'])

            if 'bank_account' in self.argu_list and self.argu_list['bank_account'] != '':
                query = query.filter(WithdrawRecord.bank_account == self.argu_list['bank_account'])

            if 'bank_of_deposit' in self.argu_list and self.argu_list['bank_of_deposit'] != '':
                query = query.filter(WithdrawRecord.bank_of_deposit == self.argu_list['bank_of_deposit'])

            if 'status' in self.argu_list and self.argu_list['status'] != '':
                status_list = self.argu_list['status'].split(',')
                query = query.filter(WithdrawRecord.status.in_(status_list))

            query = query.filter(WithdrawRecord.status.notin_(['wait_settle', 'settle_zero']))

            if 'user_id' in self.argu_list and self.argu_list['user_id'] != '':
                query = query.filter(WithdrawRecord.user_id == self.argu_list['user_id'])

            if 'settle_start' in self.argu_list and self.argu_list['settle_start'] != '':
                start = time.strptime(self.argu_list['settle_start'], '%Y/%m/%d %H:%M:%S')
                query = query.filter(WithdrawRecord.settle_end_time >= start)

            if 'settle_end' in self.argu_list and self.argu_list['settle_end'] != '':
                end = time.strptime(self.argu_list['settle_end'], '%Y/%m/%d %H:%M:%S')
                query = query.filter(WithdrawRecord.settle_end_time < end)

            #获取分页信息
            count = query.count()
            page_index = 1
            if 'page_index' in self.argu_list:
                page_index = int( self.argu_list['page_index'] )

            page_size = 20
            if 'page_size' in self.argu_list:
                page_size = int( self.argu_list['page_size'] )

            max_page = int(math.ceil(count / page_size) )
            if page_index > max_page:
                page_index = max_page

            if page_index <= 0:
                page_index = 1

            query = query.order_by(
                desc(WithdrawRecord.settle_end_time)
            ).offset(
                (page_index - 1) * page_size
            ).limit(
                page_size
            )

            page_info ={'page_index': page_index,'max_page': max_page}

            for record in query:
                withdraw_time = None
                if record.withdraw_time != None:
                    withdraw_time = record.withdraw_time.strftime('%Y/%m/%d %H:%M:%S')

                withdraw_money = ''
                if record.withdraw_money != None:
                    withdraw_money = (record.withdraw_money or 0)/10000

                record_info = {
                    'user': self.application.config['downstream'][record.user_id]['name'],
                    'user_id': record.user_id,
                    'withdraw_id': record.withdraw_id,
                    'settle_time': record.settle_start_time.strftime('%Y/%m/%d %H:%M:%S') + "-" +record.settle_end_time.strftime('%Y/%m/%d %H:%M:%S'),
                    'bank_user_name': record.bank_user_name or '',
                    'bank_account': record.bank_account or '',
                    'bank_of_deposit': record.bank_of_deposit or '',
                    'income_money': record.income_money/10000,
                    'withdraw_money': withdraw_money,
                    'withdraw_time': withdraw_time,
                    'status': record.get_status_name(record.status),
                    'status_time': record.status_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'notes_for_user': record.notes_for_user,
                    'notes_for_system': record.notes_for_system,
                    'withdraw_img_name' : record.withdraw_img_name,
                }
                record_list.append(record_info)
        except:
            log.exception('USER[{0}] get_withdraw_record EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功',{'record_list': record_list, 'page_info': page_info})

    @tornado.gen.coroutine
    def start_withdraw(self):
        log.info('USER[{0}] do start_withdraw {1}'.format(self.user_id, self.argu_list))
        withdraw_id = self.argu_list['withdraw_id']
        db_session = self.session('purus')
        try:
            record = db_session.query(WithdrawRecord).filter(WithdrawRecord.withdraw_id == withdraw_id).one_or_none()
            if record.status != 'wait_examine':
                return self.resp_json_result('fail', '状态不正确')

            bank_user_name,bank_account,bank_of_deposit = yield get_user_bank_info(record.user_id, self.application.config['connection']['repo'])
            if not bank_user_name or not bank_account or not bank_of_deposit:
                return self.resp_json_result('fail', '银行账号信息不完整')

            record.status = 'wait_withdraw'
            record.status_time = datetime.now()
            record.examine_operator = self.current_user['id']
            record.bank_user_name = bank_user_name
            record.bank_account = bank_account
            record.bank_of_deposit = bank_of_deposit

            db_session.add(record)
            db_session.commit()
            log.info('USER[{0}] do start_withdraw {1} SUCCESS'.format(self.user_id, self.argu_list))
        except:
            log.exception('USER[{0}] start_withdraw EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功')

    @tornado.gen.coroutine
    def set_withdraw_fail(self):
        log.info('USER[{0}] do set_withdraw_fail {1}'.format(self.user_id, self.argu_list))
        withdraw_id = self.argu_list['withdraw_id']
        notes_for_user = self.argu_list['notes_for_user']

        if len(notes_for_user) <= 0:
            return self.resp_json_result('fail','备注过短: {0}'.format(notes_for_user))

        db_session = self.session('purus')
        try:
            record = db_session.query(WithdrawRecord).filter(WithdrawRecord.withdraw_id == withdraw_id).one_or_none()
            if record.status not in ['wait_examine','wait_withdraw']:
                return self.resp_json_result('fail', '状态不正确')

            record.status = 'fail'
            record.status_time = datetime.now()
            record.withdraw_operator = self.current_user['id']
            record.fail_notes = notes_for_user
            record.notes_for_user = notes_for_user

            db_session.add(record)
            db_session.commit()
            yield self.update_truman_balance(record)
            log.info('USER[{0}] do set_withdraw_fail {1} SUCCESS'.format(self.user_id, self.argu_list))
        except:
            log.exception('USER[{0}] set_withdraw_fail EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功')

    @tornado.gen.coroutine
    def set_withdraw_success(self):
        log.info('USER[{0}] do set_withdraw_success {1}'.format(self.user_id, self.argu_list))
        withdraw_id = self.argu_list['withdraw_id']
        # money = self.argu_list['money']
        notes_for_user = self.argu_list['notes_for_user']

        # try:
        #     money = float(money)
        # except:
        #      return self.resp_json_result('fail', '提现金额不合法')
        # withdraw_money = money*10000

        #更新数据库
        db_session = self.session('purus')
        try:
            record = db_session.query(WithdrawRecord).filter(WithdrawRecord.withdraw_id == withdraw_id).one_or_none()
            if record.status not in ['wait_withdraw','wait_examine']:
                return self.resp_json_result('fail', '状态不正确')

            if record.withdraw_img_name == None:
                return self.resp_json_result('fail', '必须要上传转账流水截图')

            bank_user_name,bank_account,bank_of_deposit = yield get_user_bank_info(record.user_id, self.application.config['connection']['repo'])
            if not bank_user_name or not bank_account or not bank_of_deposit:
                return self.resp_json_result('fail', '银行账号信息不完整')

            record.status = 'success'
            record.status_time = datetime.now()
            record.withdraw_operator = self.current_user['id']
            record.withdraw_time = datetime.now()
            record.withdraw_money = record.income_money
            record.notes_for_user = notes_for_user

            db_session.add(record)
            db_session.commit()
            yield self.update_truman_balance(record)
            log.info('USER[{0}] do set_withdraw_success {1} SUCCESS'.format(self.user_id, self.argu_list))
        except:
            log.exception('USER[{0}] set_withdraw_success EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功')

    def change_user_notes(self):
        return self.resp_json_result('ok', '成功')

    @tornado.gen.coroutine
    def update_truman_balance(self,record):
        #修改卡库的余额值
        try:
            http_client = AsyncHTTPClient()
            requ_data = {
                'requ_type': 'add_balance',
                'argu_list':{
                    'user_id': record.user_id,
                    'withdraw_id': record.withdraw_id,
                    'add_balance': -record.income_money
                }
            }
            log.info('USER[{0}] update_truman_balance REQU: {1}'.format(self.user_id, requ_data))
            request = HTTPRequest(url=self.application.config['connection']['truman']+'/api/balance', method='POST',body=json.dumps(requ_data))
            resp = yield http_client.fetch(request)
            resp_data = json.loads(resp.body.decode())
            log.info('USER[{0}] update_truman_balance RESP: {1}'.format(self.user_id, resp_data))
        except:
            log.exception('USER[{0}] update_truman_balance EXCEPTION!!!'.format(self.user_id))


    def upload_withdraw_img(self):
        log.info('USER[{0}] do upload_withdraw_img'.format(self.user_id))

        withdraw_id = self.argu_list['withdraw_id']
        file = self.request.files['withdraw_img'][0]

        if file['content_type'] not in ['image/gif', 'image/jpeg', 'image/jpg', 'image/png']:
            return self.resp_json_result('fail','不支持的文件格式,只能上传(gif, jpeg, jpg, png)')

        #判断文件大小
        if len(file['body']) > 200*1024:
            return self.resp_json_result('fail', '文件大小不能超过200k')

        db_session = self.session('purus')
        try:
            record = db_session.query(WithdrawRecord2).filter(WithdrawRecord.withdraw_id == withdraw_id).one_or_none()
            if record.status not in ['wait_withdraw','wait_examine']:
                return self.resp_json_result('fail', '状态不正确')

            record.withdraw_img = file['body']
            record.withdraw_img_name = file['filename']

            db_session.add(record)
            db_session.commit()
            log.info('USER[{0}] do upload_withdraw_img SUCCESS'.format(self.user_id))
        except:
            log.exception('USER[{0}] upload_withdraw_img EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功')

