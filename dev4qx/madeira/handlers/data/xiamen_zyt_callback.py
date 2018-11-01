import logging
import time
import json

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    "00000": "1",
    "10001": "9",  # 空号/号码不存在
    "10010": "9",  # 欠费/停机
    "10012": "9",  # 号码已冻结或注销
    "10013": "9",  # 黑名单客户
    "10018": "9",  # 不能重复订购
    "10024": "9",  # 业务互斥
    "10033": "9",  # 在途工单
    "10057": "9",  # 号码归属地信息不正确
    "10058": "9",  # 客户业务受限
    "10063": "9",  # 用户状态异常
    "10074": "9",  # 用户信息不存在
    "10225": "9",  # 无主套餐
    "80004": "9",  # 解析接收报文异常
    "90001": "9",  # 系统异常
    "90003": "9",  # 模拟异常报竣
    "10003": "9",  # 非法参数
    "10006": "9",  # 非法客户
    "10007": "9",  # 非法销售品
    "10008": "9",  # 非法请求流水号
    "10030": "9",  # 非法合同编号
    "10031": "9",  # 销售品未配置
    "10040": "9",  # 服务无权访问
    "10054": "9",  # 销售品配置异常
    "10081": "9",  # 销售品不存在
    "10091": "9",  # 回调地址未配置
    "10109": "9",  # 活动省份不存在
    "10230": "9",  # 重复请求流水号
    "10236": "9",  # 无订购记录，重发失败
    "10237": "9",  # 订购已成功，无需重发
    "80002": "9",  # 网络异常
    "99999": "9",  # 系统未知错误
    "1": '9',  # 发送失败
    "2": '9',  # 参数有误
    "3": '9',  # 非法渠道或者订单编号重复
    "6": '9',  # 请求状态异常，充值失败
    "5": '9',  # 加密失败
    "7": '9',  # 余额不足
    "8": '9',  # 找不到对应的产品或渠道折扣
    "9": '9',  # 请求失败
}


class CallbackXiamenZytHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode()

        callback_order = json.loads(body)

        try:
            order_id = callback_order["orderno"]

            request_log.info('CALLBACK %s - %s', self.request.uri, body, extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order["resultcode"]

            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status, '9')

            if self.back_result is None:
                request_log.error('INVALID STATUS %s', status, extra={'orderid': order_id})
                return


            master = self.master

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time)
            })

        except Exception as e:
            request_log.info('CALLBACK %s - %s', self.request.uri, self.request.body, extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        self.finish(json.dumps({"result_code": "0"}))

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
