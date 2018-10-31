import tornado
from handler.fuel_card import FuelCardJsonHandler
from db.madeira import get_order_shard
from db.modem_forrestal import SinopecForrestalOrder
import math
from sqlalchemy import desc, or_, and_
from utils.escape import escape_sinopec_result
import time
from db.purus import FuelCardOrder
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import logging
from tornado.web import HTTPError
import xlsxwriter

log = logging.getLogger("purus.request")

class FuelCardOrderListHandler(FuelCardJsonHandler):
    ON_EXPORT = set()
    def __init__(self, application, request, **kwargs):
        self.db_session = None
        self.db_query = None
        self.order_cls = None

        super(FuelCardOrderListHandler, self).__init__(application, request, **kwargs)

    @tornado.web.authenticated
    @gen.coroutine
    def get(self):
        if not self.requ_type:
            return self.render('fuel_card/order_list.html', title=self.application.title)
        elif self.requ_type == 'query':
             yield self.query_order_list()
             return
        elif self.requ_type == 'export':
             yield self.export_order_list()
             return
    
        return self.resp_json_result('fail', '未知请求')


    @tornado.web.authenticated
    @gen.coroutine
    def post(self):    
        return self.resp_json_result('fail', '未知请求')

    @gen.coroutine
    def query_order_list(self):
        try:
            q = self.prepare_query()
            yield self.application.thread_executor.submit(self.driver_query_order_list)
        finally:
            if self.db_session:
                self.db_session.close()

        #self.driver_query_order_list()
        #return self.resp_json_result('ok', 'success', {'order_list': [], 'page_info': None})

    #异步调用
    def prepare_query(self):
        if 'master' in self.application.config['downstream'][self.user_id]:
            master_id = self.application.config['downstream'][self.user_id]['master']
        else:
            master_id = self.user_id

        if 'shard_id' in self.application.config['downstream'][self.user_id]:
            shard_id = self.application.config['downstream'][self.user_id]['shard_id']
        else:
            shard_id = master_id
        

        self.db_session = self.session('madeira')
        self.order_cls = get_order_shard(shard_id)

        #判断是否需要通过任务ID过滤
        self.db_query = self.db_session.query(
                self.order_cls.user_id,
                self.order_cls.order_id,
                self.order_cls.mobile,
                self.order_cls.price,
                self.order_cls.req_time,
                self.order_cls.back_time,
                self.order_cls.back_result,
                self.order_cls.result,

                SinopecForrestalOrder.card_id,
                SinopecForrestalOrder.account_price,
                SinopecForrestalOrder.bot_account,
                SinopecForrestalOrder.site_msg,
                SinopecForrestalOrder.status,
            ).outerjoin(
                (SinopecForrestalOrder, SinopecForrestalOrder.order_id == self.order_cls.order_id)
            )

        #根据任务ID查询
        if 'task_id' in self.argu_list and self.argu_list['task_id']:
            self.db_query = self.db_query.filter( and_(FuelCardOrder.task_id == self.argu_list['task_id'], self.order_cls.sp_order_id == FuelCardOrder.order_id) )

        #通过用户ID过滤
        if 'admin' not in self.current_user['roles']:
            self.argu_list['user_id'] = self.user_id
        if 'user_id' in self.argu_list and self.argu_list['user_id']:
            self.db_query = self.db_query.filter(self.order_cls.user_id == self.argu_list['user_id'])

        #通过订单编号过滤
        if 'order_id' in self.argu_list and self.argu_list['order_id']:
            self.db_query = self.db_query.filter(self.order_cls.order_id == self.argu_list['order_id'])
            
        #通过加油卡账号过滤
        if 'account' in self.argu_list and self.argu_list['account']:
            self.db_query = self.db_query.filter(self.order_cls.mobile == self.argu_list['account'])

        #通过充值卡卡号过滤
        if 'card_id' in self.argu_list and self.argu_list['card_id']:
            self.db_query = self.db_query.filter(SinopecForrestalOrder.card_id == self.argu_list['card_id'])

        #通过面值过滤
        if 'price' in self.argu_list and self.argu_list['price']:
            self.db_query = self.db_query.filter(self.order_cls.price == self.argu_list['price'])

        #通过订单状态过滤
        if 'result' in self.argu_list and self.argu_list['result']:
            order_type = self.argu_list['result']
            if self.argu_list['result'] == '1': #读取成功的订单
                self.db_query = self.db_query.filter(self.order_cls.back_result == '1')
            elif self.argu_list['result'] == '0': #读取充值中的订单
                self.db_query = self.db_query.filter( and_(self.order_cls.result == '0',self.order_cls.back_result == None) )
            elif self.argu_list['result'] == '9': #读失败的订单
                self.db_query = self.db_query.filter( or_(self.order_cls.result != '0', self.order_cls.back_result == '9' ) )
            elif self.argu_list['result'] == '-1': #卡在forrestal的订单
                self.db_query = self.db_query.filter( and_(self.order_cls.result == '0',self.order_cls.back_result == None) )
                self.db_query = self.db_query.filter( SinopecForrestalOrder.status == 'unknown' )

        #通过时间过滤
        if 'start' in self.argu_list and 'end' in self.argu_list and self.argu_list['start'] and self.argu_list['end']:
            start = time.strptime(self.argu_list['start'], '%Y/%m/%d %H:%M:%S')
            end = time.strptime(self.argu_list['end'], '%Y/%m/%d %H:%M:%S')
            self.db_query = self.db_query.filter(self.order_cls.req_time >= start).filter(self.order_cls.req_time < end)


    def driver_query_order_list(self):
        order_list = []
        page_info = None

        #获取分页信息
        page_index = 1
        if 'page_index' in self.argu_list:
            page_index = int( self.argu_list['page_index'] )

        page_size = 1
        if 'page_size' in self.argu_list:
            page_size = int( self.argu_list['page_size'] )

        count = self.db_query.count()
        max_page = int(math.ceil(count / page_size) )

        if page_index > max_page:
            page_index = max_page

        if page_index <= 0:
            page_index = 1

        self.db_query = self.db_query.order_by(
            desc(self.order_cls.req_time)
        ).offset(
            (page_index - 1) * page_size
        ).limit(
            page_size
        )

        page_info ={'page_index': page_index,'max_page': max_page}

        #组装订单信息列表
        for order in self.db_query:
            result_code = order.back_result or order.result
            if result_code == '0' and order.status == 'unknown':
                result_code = '-1'

            order_info = {
                #
                'user_id': order.user_id, 
                'order_id': order.order_id, 
                'account': order.mobile,
                'price': order.price,
                'create': str(order.req_time),
                'update': order.back_time and str(order.back_time),
                'status': escape_sinopec_result(result_code),

                #
                'card_id': order.card_id,
                'account_price': order.account_price,
                'bot_account': order.bot_account,
                'err_data': order.site_msg
            }

            order_list.append(order_info)
 

        return self.resp_json_result('ok', 'success', {'order_list': order_list, 'page_info': page_info})


    @gen.coroutine
    def export_order_list(self):
        try:
            if self.user_id in self.ON_EXPORT:
                return self.resp_json_result('fail', '存在未完成的导出任务!!!')
            self.ON_EXPORT.add(self.user_id)

            q = self.prepare_query()
            yield self.application.thread_executor.submit(self.driver_export_order_list)
        finally:
            if self.db_session:
                self.ON_EXPORT.remove(self.user_id)
                self.db_session.close()

    def driver_export_order_list(self):
        self.db_query = self.db_query.order_by(desc(self.order_cls.req_time)).limit(100000)

        path = 'exports/export_%s.xlsx' % self.user_id
        workbook = xlsxwriter.Workbook(path)
        worksheet = workbook.add_worksheet()

        worksheet.write(0, 0, '订单编号')
        worksheet.write(0, 1, '账号')
        worksheet.write(0, 2, '开始时间')
        worksheet.write(0, 3, '状态时间')
        worksheet.write(0, 4, '订单状态')
        worksheet.write(0, 5, '充值卡号码')
        worksheet.write(0, 6, '面值')
        worksheet.write(0, 7, '到账金额')
        worksheet.write(0, 8, '外挂账号')
        worksheet.write(0, 9, '外挂信息')

        row = 1
        # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
        for order in self.db_query:
            result_code = order.back_result or order.result
            if result_code == '0' and order.status == 'unknown':
                result_code = '-1'

            worksheet.write(row, 0, order.order_id)
            worksheet.write(row, 1, order.mobile)
            worksheet.write(row, 2, str(order.req_time))
            worksheet.write(row, 3, order.back_time and str(order.back_time))
            worksheet.write(row, 4, escape_sinopec_result(result_code))
            worksheet.write(row, 5, order.card_id)
            worksheet.write(row, 6, order.price)
            worksheet.write(row, 7, order.account_price)
            worksheet.write(row, 8, order.bot_account)
            worksheet.write(row, 9, order.site_msg)

            row += 1

        workbook.close()

        return self.resp_json_result('ok', 'success', {'path': '/'+path})



    #@gen.coroutine
    #def export_order_list(self):
    #    try:
    #        url = self.application.config['connection']['db_exporter'] + '/fuel_card/order_list1'
    #        http_client = AsyncHTTPClient()
    #        request = HTTPRequest(url=url)
    #        response = yield http_client.fetch(request)
    #        for h in response.headers:
    #            self.set_header(h, response.headers[h])
    #        return self.finish(response.body)
    #    except HTTPError as http_error:
    #        return self.send_error(http_error.code)
    #    except:
    #        return self.send_error(403)




#转发到go服务
class FuelCardExport(FuelCardJsonHandler):
    @gen.coroutine
    def get(self,path):
        log.info("{0} EXPORT START ".format(self.user_id))
        try:
            url = self.application.config['connection']['db_exporter'] + '/export' + path
            log.info(url)
            http_client = AsyncHTTPClient()
            request = HTTPRequest(url=url)
            response = yield http_client.fetch(request)
            for h in response.headers:
                self.set_header(h, response.headers[h])
            return self.finish(response.body)
        except HTTPError as http_error:
            return self.send_error(http_error.code)
        except:
            return self.send_error(403)

