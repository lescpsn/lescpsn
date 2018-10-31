# 比特峰回馈结果
import json
import logging
import time

import tornado
import tornado.gen

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    "E00000": '1',  # 订购成功
    "E10001": '9',  # 时间戳超时
    "E10002": '9',  # 企业账号不存在
    "E10003": '9',  # ip非法
    "E10004": '9',  # 签名错误
    "E10005": '10074',  # 手机号不正确
    "E10006": '9',  # 流量产品不存在
    "E10007": '9',  # 余额不足
    "E10008": '9',  # 余额变更失败
    "E10009": '9',  # 订单提交失败
    "E10010": '9',  # 超速，同一手机号过于频繁进行充值(10分钟内超过5次)
    "E10011": '9',  # 超限，同一手机号每日充值次数超过限制（24小时内超过20次）
    "E10012": '9',  # 月末48小时（移动）、24小时（电信）无法充值
    "E20001": '9',  # 订单不存在
    "E20002": '9',  # 订单已退款
    "E20004": '9',  # 平台系统升级，请稍候订购
    "E31001": '9',  # 运营商维护
    "E31002": '9',  # 运营商侧错误
    "E31003": '10033',  # 有在途工单
    "E31004": '9',  # 此用户不可订购此产品
    "E31005": '10058',  # 客户业务受限
    "E31006": '9',  # 运营商判断此号码非法
    "E31007": '10058',  # 2G/3G 融合用户不允许订购
    "E31100": '9',  # 其他错误
    "E31101": '10111',  # 用户状态异常（？）
    "E31102": '10111',  # 用户状态异常（不在有效期）
    "E31103": '10111',  # 用户状态异常（用户套餐不能订购该业务）
    "E31104": '10111',  # 用户状态异常（叠加次数超限）
    "E31105": '10111',  # 用户状态异常（欠费停机）
    "E31106": '10111',  # 用户状态异常（服务密码为初始密码）
    "E31107": '10111',  # 用户状态异常（用户不存在）
    "E31108": '10111',  # 用户状态异常（资料不全）
    "E40001": '10111',  # 用户状态异常（黑名单用户）
    "E40002": '10111',  # 用户状态异常（身份证需要升位）
}


class CallbackBitfengHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        body = self.request.body.decode('utf-8')

        callback_order = json.loads(body)
        try:
            order_id = callback_order["client_order_id"]

            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': order_id})

            if not self.master.sismember('list:create', order_id):
                request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                return

            status = callback_order["status"]

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
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body), extra={'orderid': 'UNKNOWN'})
            request_log.exception('restore order info error', extra={'orderid': order_id})
            self.finish()
            return

        self.finish("1")

        if self.back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
