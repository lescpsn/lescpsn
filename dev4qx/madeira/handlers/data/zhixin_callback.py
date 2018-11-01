# 智信回馈结果
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler


request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '2': '1',  # 成功
    '602': '9',  # 服务器数据接收异常
    '603': '9',  # 请求数据参数格式错误
    '606': '9',  # 数据签名错误
    '621': '9',  # 商户余额不足
    '622': '9',  # 商户不存在
    '623': '9',  # 商品配置不正确
    '624': '9',  # 商品未配置
    '615': '9',  # 号码归属地信息未配置
    '625': '9',  # 重复订单号
    '751': '9',  # IP地址未绑定
    '626': '9',  # 订单号不存在
}


class CallbackZhixinHandler(CoreHandler):
    @tornado.gen.coroutine
    def get(self):
        order_id = 'UNKNOWN'

        try:
            order_id = self.get_argument("client_order_no")

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = self.get_argument("recharge_status")

            self.up_back_result = status
            self.back_result = RESULT_MAP.get(status, "9")

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
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        self.finish("SUCCESS")

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
