import tornado
from handler.fuel_card import FuelCardJsonHandler, FuelCardBaseHandler
from tornado import gen
from db.purus import FuelCardUser, FuelCardTask, FuelCardOrder,FuelCardStopHistory
from _datetime import datetime
import json
from sqlalchemy import desc, or_, and_
from handler import JsonHandler
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
import logging
from tornado.ioloop import IOLoop
import time
from utils.encryption_decryption import to_md5
import xml.etree.ElementTree as ET
import math
import re


log = logging.getLogger("purus.request")


#用于记录任务状态历史
class TaskStatusHistory:
    class STATUS_TYPE:
        OTHER = '0'  #其他状态
        CREATE = '1'  #任务创建


    @staticmethod
    def push(master, task_id, type, msg):
        try:
            master.lpush('list:task_status_history:{0}'.format(task_id), '[{0}]{1} {2}'.format(type,datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg))
        except:
            log.exception('TaskStatusHistory push')

    @staticmethod
    def get_last_status_list(master, task_id, count=10):
        status_list = []
        try:
            for i in range(count):
                status = master.lindex('list:task_status_history:{0}'.format(task_id), i)
                if not status:
                    break
                status_list.append(status)
        except:
            log.exception('TaskStatusHistory get_last_status_list')

        status_list = status_list[::-1]
        return status_list

    @staticmethod
    def delete(master, task_id):
        try:
            master.expire('list:task_status_history:{0}'.format(task_id), 60*60*24*30) #存一个月
        except:
            log.exception('TaskStatusHistory delete')

class BigRechargeBase:
    ORDER_FORMAT = 'product=sinopec&userid={userid}&price={price}&num=1&account_number={account_number}&spordertime={spordertime}&sporderid={sporderid}'
    def order_id(self):
        uid = self.master.incr('uid', 3)
        t = time.strftime("%Y%m%d%H%M%S", time.localtime())
        return 'F%s%08d' % (t, uid)

    def get_price(self,task_id):
        price_seq = self.master.get('task_price_seq:{0}'.format(task_id))
        if not price_seq:
            return None

        price_seq = eval(price_seq)

        for p in price_seq:
            count = self.master.decr('task_price:{0}:{1}'.format(task_id, p))
            if count <0:
                self.master.delete('task_price:{0}:{1}'.format(task_id, p))
                continue
            if count == 0:
                self.master.delete('task_price:{0}:{1}'.format(task_id, p))
            return p

        return None

    def restore_price(self,task_id, price):
        self.master.incr('task_price:{0}:{1}'.format(task_id, price))

    @gen.coroutine
    def send_fuel_card_order(self,task_id):
        #判断当前状态
        task_info = self.get_task_info_by_task_id(task_id)
        if task_info['task_status'] != FuelCardTask.Status.RUNNING:
            return

        price = self.get_price(task_id)
        if not price:  #没有订单了
            self.stop_task(task_id, stop_info={'msg':'本轮订单已处理完毕'})
            TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '已没有可以处理的订单，任务暂停！！！' )
            return

        account = self.master.hget('map:task_info:{0}'.format(task_id), 'account')

        downstream = self.application.config['downstream'][self.user_id]
        order_id = None
        try:
            order_id = self.order_id()
            back_url = self.application.config['connection']['fuel_card_callback']
            order = self.ORDER_FORMAT.format(userid=self.user_id,
                                price=price,
                                account_number= account,
                                spordertime=datetime.now().strftime("%Y%m%d%H%M%S"),
                                sporderid=order_id
                                )

            sign = order + "&key=" + downstream['key']
            requ_body = order + "&sign="+to_md5(sign) + "&back_url=" + back_url

            url = 'http://{shard}/order.do'.format(shard=downstream['shard'])

            log.info("{0} {1} RECHARGE REQU: {2} {3} ".format(task_id, order_id, url, order) )

            http_client = AsyncHTTPClient()
            request = HTTPRequest(url=url, method='POST', body=requ_body)
            response = yield http_client.fetch(request)
            resp_data = response.body.decode()

            log.info("{0} {1} RECHARGE RESP: {2} ".format(task_id, order_id,resp_data) )

            root = ET.fromstring(resp_data)
            result = root.find('resultno').text
            related_id = root.find('orderid').text

            if result == '0':
                self.master.hmset('map:task_order:{0}'.format(related_id), {'task_id': task_id, 'price': price, 'user_id': self.user_id, 'order_id': order_id})
                self.master.expire('map:task_order:{0}'.format(related_id), 60*60*24*30)  #一个月之后自动删除

                self.master.set('task_up_order:{0}'.format(order_id), related_id)
                self.master.expire('task_up_order:{0}'.format(order_id), 60*60*24*30)  #一个月之后自动删除

                TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} {1}元订单创建成功'.format(related_id,price) )

                log.info("{0} {1} RECHARGE REQU SUCCESS".format(task_id, order_id) )
                IOLoop.instance().call_later(5, self.send_fuel_card_order, task_id)   #每隔5秒发送一个订单
            else:
                self.restore_price(task_id, price)
                self.stop_task(task_id, order_id=related_id or order_id, stop_info={'msg':'内部异常，订单直接失败'})
                TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} {1}元订单创建失败,任务停止！！！'.format(related_id,price) )

                log.info("{0} {1} RECHARGE REQU FAIL".format(task_id, order_id) )
        except:
            log.exception("{0} {1} RECHARGE EXCEPTION".format(task_id, order_id) )

        if order_id:
            self.save_order(task_id, order_id)

    def save_order(self, task_id, order_id):
        try:
            self.db_session = self.session('purus')
            order = FuelCardOrder()
            order.task_id = task_id
            order.order_id = order_id

            self.db_session.add(order)
            self.db_session.commit()
        finally:
            self.db_session.close()

    def stop_task(self, task_id, order_id=None, stop_info=None):
        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(
                    FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_id
                )
            task = q.one_or_none()
            stop_count = task.stop_count + 1
            q.update(
                    {FuelCardTask.task_status: FuelCardTask.Status.PAUSE,
                    FuelCardTask.stop_time: datetime.now(),
                    FuelCardTask.stop_count: stop_count,
                     }
                )

            stop_history = FuelCardStopHistory()
            stop_history.task_id = task_id
            stop_history.seq = stop_count
            stop_history.order_id = order_id
            stop_history.stop_info = str(stop_info)
            stop_history.stop_time = datetime.now()
            self.db_session.add(stop_history)

            self.db_session.commit()
        finally:
            self.db_session.close()
    
    #当所有的订单都跑完
    def complete_task(self, task_id):
        try:
            self.db_session = self.session('purus')
            self.db_session.query(
                    FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_id
                ).update(
                    {FuelCardTask.task_status: FuelCardTask.Status.COMPLETE,
                    FuelCardTask.complete_time: datetime.now(),
                    }
                )

            self.db_session.commit()
        finally:
            self.db_session.close()


    def finish_task(self, task_id):
        try:
            self.db_session = self.session('purus')
            self.db_session.query(
                    FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_id
                ).update(
                    {FuelCardTask.task_status: FuelCardTask.Status.FINISH,
                    FuelCardTask.finish_time: datetime.now(),
                    }
                )

            self.db_session.commit()
        finally:
            self.db_session.close()

    def get_task_info_by_task_id(self, task_id):
        result = None
        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(
                        FuelCardTask
                    ).filter(
                         FuelCardTask.task_id ==  task_id
                    )
            result = q.first()
        finally:
            self.db_session.close()

        if result:
            return {
                'task_id': result.task_id,
                'task_status': result.task_status,
                'create_time': str(result.create_time),
                'account': result.account,
                'price_list': json.loads(result.price_list),
                'total_order_count': result.total_order_count,
                'total_price': result.total_price,
            }
        else:
            return None

class FuelCardCallBackHandler(JsonHandler,BigRechargeBase):
    def update_success_price(self, task_id, price):
        success_price = 0
        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(
                    FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_id
                )

            task_info = q.one_or_none()
            success_price = task_info.success_price + int(price)
            if task_info:
                q.update({FuelCardTask.success_price: success_price })
                log.info("{0} SUCCESS PRICE {1} ADD {2} SUCCESS".format(task_id,task_info.success_price, price))
            else:
                log.error("{0} SUCCESS PRICE {1} ADD {2} FAIL".format(task_id,task_info.success_price, price))

            self.db_session.commit()
        finally:
            self.db_session.close()

        return success_price

    def post(self):
        self.finish('1')
        resp_data = self.request.body.decode()
        log.info("FUEL CARD CALLBACK {0}".format(resp_data))

        result = self.get_body_argument('resultno')
        related_id = self.get_body_argument('orderid')
        order_id = self.get_body_argument('sporderid')
        #签名检查

        #判断任务来源
        task_id,price,self.user_id,order_id2= self.master.hmget('map:task_order:{0}'.format(related_id), 'task_id', 'price', 'user_id', 'order_id')

        if order_id != order_id2:
            log.error("CALLBACK order_id not match")

        self.master.delete('map:task_order:{0}'.format(related_id) )
        if not task_id or not price:
            log.error("{0} CALLBACK UNKNOWN ORDER".format(order_id))
            return

        task_info = self.get_task_info_by_task_id(task_id)
        if not task_info:
            log.error("{0} CALLBACK TASK INFO ERROR".format(order_id))
            return

        #如果充值失败，记录失败次数
        if result != '1':
            TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} {1}元订单充值失败'.format(related_id, price) )
            self.restore_price(task_id, price)
            if task_info['task_status'] == FuelCardTask.Status.RUNNING:
                fail_count = self.master.incr('task_fail_count:{0}'.format(task_id)) #如果超出剩余的订单数量自动停止
                success_count = self.master.get('task_success_count:{0}'.format(task_id)) or 0 #如果超出剩余的订单数量自动停止
                if fail_count + success_count >= task_info['total_order_count'] + 1: #允许超出总订单数三个
                    self.stop_task(task_id, order_id=order_id, stop_info={'msg':'本轮订单失败次数达到上限'})
                    TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '本轮订单失败次数达到上限， 任务暂停！！！')
            return

        TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} {1}元订单充值成功'.format(related_id, price) )

        #更新成功的订单金额
        success_price = self.update_success_price(task_id, price)

        self.master.incr('task_success_count:{0}'.format(task_id))

         #如果金额与设定的金额一致将会表示订单完成
        if task_info['task_status'] != FuelCardTask.Status.FINISH and success_price >= task_info['total_price']:
            self.complete_task(task_id)
            if success_price > task_info['total_price']:
                TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} 超过需要充值的金额({1}/{2})！！！ 任务完成。'.format(related_id, success_price,task_info['total_price']) )
            else:
                TaskStatusHistory.push(self.master, task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} 达到充值金额({1}/{2}), 任务完成。'.format(related_id,success_price, task_info['total_price']) )


class FuelCardModemForrestaCalllHandler(FuelCardBaseHandler, BigRechargeBase):
    def post(self):
        self.finish('ok')

        requ_body = self.request.body.decode()
        log.info('Forrestal REQU: {0}'.format(requ_body))
        self.args = json.loads( requ_body )
        self.requ_type = self.args['requ_type']
        self.site_msg = self.args.get('site_msg', '')


        #订单信息检查 如果不属于任何一个任务将会退出处理流程
        self.related_id = self.args['order_id']
        self.task_id, self.price, self.user_id,self.order_id= self.master.hmget('map:task_order:{0}'.format(self.related_id),'task_id', 'price', 'user_id', 'order_id')
        if not self.task_id:
            return 
        self.task_info = self.get_task_info_by_task_id(self.task_id)
        if not self.task_info:
            return

        if self.requ_type == 'order_exception':  #对于异常订单会停止任务
            return self.on_order_exception()

        elif self.requ_type == 'order_unknown':  #卡单只会记录信息
            return self.on_order_unknown()

    def on_order_exception(self):
        if self.task_info['task_status'] != FuelCardTask.Status.RUNNING:
            TaskStatusHistory.push(self.master, self.task_id,
                                   TaskStatusHistory.STATUS_TYPE.OTHER, 
                                   '遇到异常订单{0}，任务已暂停！！！'.format(self.related_id) )
        else:
            self.stop_task(self.task_id, self.order_id, self.site_msg)
            TaskStatusHistory.push(self.master, self.task_id,
                                   TaskStatusHistory.STATUS_TYPE.OTHER, 
                                   '遇到异常订单{0}, 任务暂停！！！'.format(self.related_id) )


    def on_order_unknown(self):
        TaskStatusHistory.push(self.master, self.task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '{0} 卡单！！！'.format(self.related_id) )


class FuelCardBigRechargeHandler(FuelCardJsonHandler,BigRechargeBase):
    @gen.coroutine
    @tornado.web.authenticated
    def get(self):
        if not self.requ_type:
            if 'fuel-card-big-recharge' not in self.current_user['roles']:
                return self.redirect('/auth/login')
            else:
                return self.render('fuel_card/big_recharge.html', title=self.application.title)
        elif self.requ_type == 'get_task_info':
            return self.get_task_info()
        elif self.requ_type == 'get_task_status':
            return self.get_task_status()
        elif self.requ_type == 'get_task_list':
            return self.get_task_list()
        elif self.requ_type == 'get_status_history':
            return self.get_status_history()

        return self.resp_json_result('fail', '未知请求')

    @gen.coroutine
    @tornado.web.authenticated
    def post(self):
        if 'fuel-card-big-recharge' not in self.current_user['roles']:
            return self.send_error(404)

        if self.requ_type == 'add_task':
            return self.add_task()
        elif self.requ_type == 'start_task':
            return self.try_start_task()
        elif self.requ_type == 'stop_task':
            return self.try_stop_task()
        elif self.requ_type == 'finish_task':
            return self.try_finish_task()

        return self.resp_json_result('fail', '未知请求')

    @property
    def task_info(self):
        result = None
        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(
                        FuelCardTask
                    ).filter(
                         FuelCardTask.user_id ==  self.user_id,
                         FuelCardTask.task_id ==  FuelCardUser.task_id_now,
                    )
        
            result = q.first()
        finally:
            self.db_session.close()

        if result:
            return {
                'task_id': result.task_id,
                'task_status': result.task_status,
                'create_time': str(result.create_time),
                'account': result.account,
                'price_list': json.loads(result.price_list),
                'total_order_count': result.total_order_count,
                'total_price': result.total_price,
                'success_price': result.success_price,
            }
        else:
            return None


    #获取新的任务ID 
    def get_new_task_id(self):
        q = self.db_session.query(FuelCardUser).filter(FuelCardUser.user_id == self.user_id)
        user = q.one_or_none()
        if user == None:
            user = FuelCardUser()
            user.user_id = self.user_id
            user.task_count = 1
            user.task_id_now = None

            self.db_session.add(user)
        else:
            q.update({FuelCardUser.task_count:user.task_count+1})
        
        #设置新的任务ID
        task_id_now = self.user_id.upper() + "%06d" % user.task_count
        q.update({FuelCardUser.task_id_now:task_id_now})
        return task_id_now

    def get_task_info(self):
            return self.resp_json_result('ok', '成功', self.task_info)

    def get_task_status(self):
        task_info = self.task_info
        if not task_info:
            return self.resp_json_result('fail', '未找到任务')
        
        task_status = {}
        #获取总订单数量
        total_order = 0              #总订单数量
        total_success_order = 0      #总成功订单数
        total_fail_order = 0         #总失败订单数
        total_processing_order = 0   #总充值中订单数

        total_price = 0              #总面值
        total_success_price = 0      #总成功金额数
        total_fail_price = 0         #总失败金额数
        total_processing_price = 0   #总处理中的金额数

        try:
            self.db_session = self.session('purus')
        finally:
            self.db_session.close()                  

        task_status = {
            'total_order' : total_order,
            'total_success_order' : total_success_order,
            'total_fail_order' : total_fail_order,
            'total_processing_order' : total_processing_order,

            'total_price' : total_price,
            'total_success_price' : total_success_price,
            'total_fail_price' : total_fail_price,
            'total_processing_price' : total_processing_price,
        }
        return self.resp_json_result('ok', '成功', task_status)

    def get_status_history(self):
        task_info = self.task_info
        if not task_info:
            return self.resp_json_result('fail', '未找到任务')
        
        task_id = task_info['task_id']
        task_history_list = TaskStatusHistory.get_last_status_list(self.master, task_info['task_id'], 10)
        return self.resp_json_result('ok', '成功', {'task_history_list': task_history_list})

    def add_task(self):
        if self.task_info:
            return self.resp_json_result('fail', '同一时间状态下只允许存在一个任务， 任务{0}还没有结束!!!!'.format(self.task_info['task_id']))

        try:
            account = self.argu_list['account']
            price_list = self.argu_list['price_list'] 

            #检查输入参数的合法性
            if not re.match(r'\d{19}', account):
                return self.resp_json_result('fail', '账号不合法')

            #检查卡是否够


            #计算总数
            total_order_count = 0
            total_price = 0
            for price_info in price_list:
                price = 0
                try:
                    price = int(price_info['price'])
                except:
                    price = 0

                count = 0
                try:
                    count = int(price_info['count'])
                except:
                    count = 0

                total_order_count += count
                total_price += price*count

            if total_price <= 0:
                return self.resp_json_result('fail', '充值金额非法')

            self.db_session = self.session('purus')
            fuel_card_task = FuelCardTask()
            fuel_card_task.user_id = self.user_id
            fuel_card_task.account = account
            fuel_card_task.price_list = json.dumps( price_list)
            fuel_card_task.task_status = FuelCardTask.Status.PAUSE
            fuel_card_task.task_id = self.get_new_task_id()
            fuel_card_task.create_time = datetime.now()
            fuel_card_task.total_order_count = total_order_count
            fuel_card_task.total_price = total_price
            fuel_card_task.success_price = 0
            fuel_card_task.stop_count = 0

            self.db_session.add(fuel_card_task)

            #存储任务基本信息
            self.argu_list['user_id'] = fuel_card_task.user_id
            self.argu_list['total_order_count'] = fuel_card_task.total_order_count
            self.argu_list['total_price'] = fuel_card_task.total_price
            self.master.hmset('map:task_info:{0}'.format(fuel_card_task.task_id), self.argu_list)

            #存储将面值信息和使用顺序
            price_seq = []
            for price_info in price_list:
                price = 0
                try:
                    price = int(price_info['price'])
                except:
                    continue

                count = 0
                try:
                    count = int(price_info['count'])
                except:
                    continue

                self.master.set('task_price:{0}:{1}'.format(fuel_card_task.task_id, price), count)
                price_seq.append(price)
            self.master.set('task_price_seq:{0}'.format(fuel_card_task.task_id) , price_seq)

            self.db_session.commit()

            #记录任务状态历史
            TaskStatusHistory.push(self.master, fuel_card_task.task_id,TaskStatusHistory.STATUS_TYPE.OTHER, '任务创建' )

        finally:
            self.db_session.close()

        return self.resp_json_result('ok', '新增任务成功')

    #启动任务
    def try_start_task(self):
        task_info = self.task_info
        if not task_info:
            return self.resp_json_result('fail', '未找到任务')
        if task_info['task_id'] != self.argu_list['task_id']:
            return self.resp_json_result('fail', '任务ID不匹配')

        if task_info['task_status'] != FuelCardTask.Status.PAUSE:
            return self.resp_json_result('fail', '任务状态非法')

        try:
            self.db_session = self.session('purus')
            self.db_session.query(
                FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_info['task_id']
                ).update(
                    {FuelCardTask.task_status: FuelCardTask.Status.RUNNING,
                     FuelCardTask.start_time: datetime.now(),
                     }
                )
            self.db_session.commit()

            TaskStatusHistory.push(self.master, task_info['task_id'],TaskStatusHistory.STATUS_TYPE.OTHER, '手动开始' )

            #立刻发送1个订单
            self.master.delete('task_fail_count:{0}'.format(task_info['task_id']))
            IOLoop.instance().add_callback(self.send_fuel_card_order, task_info['task_id'])
        finally:
            self.db_session.close()

        return self.resp_json_result('ok', '操作成功')

    #暂停任务
    def try_stop_task(self, order_id=None, stop_info=None):
        task_info = self.task_info
        if not task_info:
            return self.resp_json_result('fail', '未找到任务')
        if task_info['task_id'] != self.argu_list['task_id']:
            return self.resp_json_result('fail', '任务ID不匹配')

        if task_info['task_status'] != FuelCardTask.Status.RUNNING:
            return self.resp_json_result('fail', '任务状态非法')

        try:
            self.db_session = self.session('purus')
            stop_count = 1
            q = self.db_session.query(
                    FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_info['task_id']
                )

            task = q.one()
            stop_count = task.stop_count + 1
            q.update(
                    {FuelCardTask.task_status: FuelCardTask.Status.PAUSE,
                    FuelCardTask.stop_time: datetime.now(),
                    FuelCardTask.stop_count: stop_count
                    }
                )
             
            stop_history = FuelCardStopHistory()
            stop_history.task_id = task_info['task_id']
            stop_history.seq = stop_count
            stop_history.stop_time = datetime.now()
            stop_history.order_id = None
            stop_history.stop_info = str({'msg': '手动暂停'})

            self.db_session.add(stop_history)
            
            self.db_session.commit()

            TaskStatusHistory.push(self.master, task_info['task_id'], TaskStatusHistory.STATUS_TYPE.OTHER, '手动暂停!!!' )
        finally:
            self.db_session.close()

        return self.resp_json_result('ok', '操作成功')

    #结束任务
    def try_finish_task(self):
        task_info = self.task_info
        if not task_info:
            return self.resp_json_result('fail', '未找到任务')
        if task_info['task_id'] != self.argu_list['task_id']:
            return self.resp_json_result('fail', '任务ID不匹配')

        if task_info['task_status']  == FuelCardTask.Status.FINISH:
            return self.resp_json_result('fail', '任务状态非法')

        try:
            self.db_session = self.session('purus')
            self.db_session.query(
                FuelCardTask
                ).filter(
                    FuelCardTask.task_id == task_info['task_id']
                ).update(
                    {FuelCardTask.task_status: FuelCardTask.Status.FINISH,
                    FuelCardTask.finish_time: datetime.now(),
                    }
                )

            self.db_session.query(
                    FuelCardUser
                ).filter(
                    FuelCardUser.user_id == self.user_id
                ).update(
                    {FuelCardUser.task_id_now: None}
                )

            self.db_session.commit()
            TaskStatusHistory.push(self.master, task_info['task_id'],TaskStatusHistory.STATUS_TYPE.OTHER, '任务结束。' )

            #数据清理
            TaskStatusHistory.delete(self.master, task_info['task_id'])
            self.master.delete('task_fail_count:{0}'.format(task_info['task_id']))
            self.master.delete('task_success_count:{0}'.format(task_info['task_id']))
            self.master.delete('map:task_info:{0}'.format(task_info['task_id']))

            price_seq = self.master.get('task_price_seq:{0}'.format(task_info['task_id']))
            if  price_seq:
                price_seq = eval(price_seq)
                for p in price_seq:
                    self.master.delete('task_price:{0}:{1}'.format(task_info['task_id'], p))
                self.master.delete('task_price_seq:{0}'.format(task_info['task_id']))

        finally:
            self.db_session.close()

        return self.resp_json_result('ok', '操作成功')


    def get_task_list(self):
        task_list = []
        page_info = None;
        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(
                    FuelCardTask
                )

            #通过用户ID过滤
            if 'admin' not in self.current_user['roles']:
                self.argu_list['user_id'] = self.user_id
            if 'user_id' in self.argu_list and self.argu_list['user_id']:
                q = q.filter(FuelCardTask.user_id == self.argu_list['user_id'])


            #获取分页信息
            page_index = int( self.argu_list['page_index'] )
            page_size = int( self.argu_list['page_size'] )

            count = q.count()
            max_page = int(math.ceil(count / page_size) )

            if page_index > max_page:
                page_index = max_page

            if page_index <= 0:
                page_index = 1

            q = q.order_by(
                desc(FuelCardTask.create_time)
            ).offset(
                (page_index - 1) * page_size
            ).limit(
                page_size
            )

            page_info ={'page_index': page_index,'max_page': max_page}


            #组装订单信息列表
            order_list = []
            for task in q:
                status_time = None
                if task.task_status == FuelCardTask.Status.PAUSE:
                    status_time = task.stop_time or task.create_time
                elif task.task_status == FuelCardTask.Status.RUNNING:
                    status_time = task.start_time
                elif task.task_status == FuelCardTask.Status.FINISH:
                    status_time = task.finish_time
                elif task.task_status == FuelCardTask.Status.COMPLETE:
                    status_time = task.complete_time

                task_info = {
                    #
                    'task_id': task.task_id, 
                    'account': task.account, 
                    'create_time': task.create_time and str(task.create_time), 
                    'finish_time': task.finish_time and str(task.finish_time), 
                    'status': FuelCardTask.get_status_info(task.task_status), 
                    'status_time': status_time and str(status_time), 
                    'total_price': task.total_price, 
                    'success_price': task.success_price, 
                    'notes': task.notes, 
                }
                task_list.append(task_info)
        finally:
            self.db_session.close()

        return self.resp_json_result('ok', 'success', {'task_list': task_list, 'page_info': page_info })


#任务检查模块， 当大额充值过程中，程序异常重启时，执行这个
class FuelCardBigRechargeCheckHandler(FuelCardBaseHandler, BigRechargeBase):
    @staticmethod
    def check(application):
        url = 'http://localhost:{0}/fuel_card/big_recharge_task_check'.format(application.port)
        request = HTTPRequest(url=url, method='POST', body='')
        IOLoop.instance().add_callback(FuelCardBigRechargeCheckHandler.driver_check,request)

    @staticmethod
    @gen.coroutine
    def driver_check(request):
        try:
            http_client = AsyncHTTPClient()
            response = yield http_client.fetch(request)
            resp_data = response.body.decode()
            log.info('FuelCardBigRechargeCheckHandler CHECK RESP: {0}'.format(resp_data))
        except:
            log.exception('FuelCardBigRechargeCheckHandler CHECK EXCEPTION')

    @gen.coroutine
    def post(self):
        if self.request.remote_ip not in ['127.0.0.1', '::1']:
            return self.send_error(403)

        try:
            self.db_session = self.session('purus')
            q = self.db_session.query(
                    FuelCardUser.user_id,
                    FuelCardUser.task_id_now
                ).filter(
                    and_(FuelCardUser.task_id_now == FuelCardTask.task_id, FuelCardTask.task_status == FuelCardTask.Status.RUNNING)
                )

            user_list = q.all()
            for user_info in user_list:
                try:
                    yield self.send_fuel_card_order(user_info.task_id_now)
                except:
                    pass
        finally:
            self.db_session.close()

        self.finish('ok')
