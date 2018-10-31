import json
import logging
import math
import time
from urllib.parse import urlencode

import tornado
from sqlalchemy import desc
from tornado import iostream
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

from db.purus import WithdrawRecord, WithdrawRecord2
from handler import JsonHandler2
from handler.admin.admin_withdraw import get_user_bank_info

log = logging.getLogger("purus.request")

class WithdrawHandler(JsonHandler2):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def get(self):
        if 'withdraw' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if self.requ_type == None:
            return self.render('withdraw.html',  title=self.application.title)

        if self.requ_type == 'get_wait_settle_money':
             yield self.get_wait_settle_money_from_truman()
             return
        elif self.requ_type == 'get_supplier_bank_info':
            yield self.get_supplier_bank_info()
            return
        elif self.requ_type == 'get_withdraw_record':
            return self.get_withdraw_record()
        elif self.requ_type == 'get_withdraw_img':
            yield self.get_withdraw_img()
            return

        return self.resp_json_result('fail', '未知请求')

    @tornado.web.authenticated
    def post(self):
        if 'withdraw' not in self.current_user['roles']:
            return self.resp_json_result('fail', '鉴权失败')

        return self.resp_json_result('fail', '未知请求')

    def get_wait_settle_money(self):
        db_session = self.session('purus')

        wait_settle_money = 0
        try:
            query = db_session.query(WithdrawRecord.income_money.label('wait_settle_money')).filter(WithdrawRecord.user_id == self.user_id, WithdrawRecord.status == 'wait_settle')
            record = query.one_or_none()
            if record != None:
                wait_settle_money = record.wait_settle_money
        except:
            log.exception('USER[{0}] get_not_settle_money EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功', {'wait_settle_money': wait_settle_money/10000})

    @tornado.gen.coroutine
    def get_wait_settle_money_from_truman(self):
        wait_settle_money = 0
        try:
            requ_dict = {
                'requ_type': 'get_balance',
                'user_id': self.user_id,
            }
            requ_data = urlencode(requ_dict)

            http_client = AsyncHTTPClient()
            url = self.application.config['connection']['truman'] + '/api/balance?' + requ_data
            requ = HTTPRequest(url=url, method='GET')
            resp = yield http_client.fetch(requ)
            resp_data = json.loads(resp.body.decode())
            if resp_data['status'] == 'ok':
                wait_settle_money = resp_data['data']['balance']
        except:
            log.exception('USER[{0}] get_wait_settle_money_from_truman  balance EXCEPTION!!!'.format(self.user_id))

        return self.resp_json_result('ok', '成功', {'wait_settle_money': wait_settle_money/10000})

    @tornado.gen.coroutine
    def get_supplier_bank_info(self):
        bank_user_name,bank_account,bank_of_deposit = yield get_user_bank_info(self.user_id, self.application.config['connection']['repo'])
        bank_info = {
            'bank_user_name': bank_user_name or '<未设置>',
            'bank_account': bank_account or '<未设置>',
            'bank_of_deposit': bank_of_deposit or '<未设置>',
        }
        return self.resp_json_result('ok', '成功',bank_info)

    def get_withdraw_record(self):
        page_info = None

        record_list = []
        db_session = self.session('purus')
        try:
            query = db_session.query(WithdrawRecord).filter(WithdrawRecord.user_id == self.user_id)
            query = query.filter(WithdrawRecord.status.notin_(['wait_settle', 'settle_zero']))

            if 'status' in self.argu_list and self.argu_list['status'] != '':
                status_list = self.argu_list['status'].split(',')
                query = query.filter(WithdrawRecord.status.in_(status_list))


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

                withdraw_money = 0
                if record.withdraw_money != None:
                    withdraw_money = (record.withdraw_money or 0)/10000

                record_info = {
                    'withdraw_id': record.withdraw_id,
                    'settle_time': record.settle_start_time.strftime('%Y/%m/%d %H:%M:%S') + "-" +record.settle_end_time.strftime('%Y/%m/%d %H:%M:%S'),
                    'status': record.get_status_name(record.status),
                    'status_time': record.status_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'bank_user_name': record.bank_user_name or '',
                    'bank_account': record.bank_account or '',
                    'bank_of_deposit': record.bank_of_deposit or '',
                    'income_money': record.income_money/10000,
                    'withdraw_money': withdraw_money,
                    'withdraw_time': withdraw_time,
                    'notes': record.notes_for_user,
                    'withdraw_img_name' : record.withdraw_img_name,
                }
                record_list.append(record_info)

        except:
            log.exception('USER[{0}] get_withdraw_record EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('ok', '成功',{'record_list': record_list, 'page_info': page_info})

    @tornado.gen.coroutine
    def get_withdraw_img(self):
        withdraw_id = self.argu_list['withdraw_id']
        db_session = self.session('purus')
        try:
            if 'admin' in self.current_user['roles']:
                record = db_session.query(WithdrawRecord2).filter(WithdrawRecord.withdraw_id == withdraw_id).one_or_none()
            else:
                record = db_session.query(WithdrawRecord2)\
                    .filter(WithdrawRecord.withdraw_id == withdraw_id, WithdrawRecord.user_id == self.user_id)\
                    .one_or_none()

            if record != None and record.withdraw_img_name != None:
                self.set_header("Content-Length", len(record.withdraw_img))
                self.set_header("Content-Type", "application/octet-stream")
                self.set_header("Content-Disposition", "attachment;filename=\"{0}\"".format(record.withdraw_img_name))
                content = self.__get_file_content(record.withdraw_img)
                if isinstance(content, bytes):
                    content = [content]
                for chunk in content:
                    try:
                        self.write(chunk)
                        yield self.flush()
                    except iostream.StreamClosedError:
                        break
                return
            else:
                return self.resp_json_result('fail', '截图不存在')
        except:
            log.exception('USER[{0}] get_withdraw_img EXCEPTION!!!'.format(self.user_id))
        finally:
            db_session.close()

        return self.resp_json_result('fail', '内部异常')

    def __get_file_content(self, file_content):
        begin = 0
        remaining = len(file_content)
        while remaining > 0:
            chunk_size = 64 * 1024
            if remaining < chunk_size:
                chunk_size = remaining
            chunk = file_content[begin: begin+chunk_size]
            begin += chunk_size
            remaining -= chunk_size
            yield chunk
        return







