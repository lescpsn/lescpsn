import logging
import time
import tornado
from handlers.core import CoreHandler
import xml.etree.ElementTree as ET
from handlers.data.aspire import AspireBase

request_log = logging.getLogger("madeira.request")


class CallbackAspireHandler(CoreHandler, AspireBase):
    RESPONSE = ('<?xml version="1.0" encoding="GBK"?>'
                '<SynCardStatusRsp>'
                '<TransactionId>{TransactionId}</TransactionId>'
                '<RspCode>{RspCode}</RspCode>'
                '</SynCardStatusRsp>')

    RESULT_MAP = {
        '00': '1',
        '01': '901',  # 实体卡错误
        '02': '902',  # 手机号段查不到归属省
        '03': '903',  # BOSS无响应；04：用户已订业务与现有业务互斥，不能同时订购-
        '05': '905',  #   用户已订购该业务
        '06': '906',  # 用户未订购该业务或已退订
        '07': '907',  # 到达充值限额，开通失败
        '08': '908',  # 用户不存在
        '09': '909',  # 用户状态错误
        '10': '910',  # 落地方内部错误
        '11': '911',  # 其他错误
    }

    @tornado.gen.coroutine
    def post(self):
        order_id = 'UNKNOWN'

        request = self.parse_request(self.request.body.decode('gbk'))

        self.finish(self.produce_response_body(request['transaction_id'], request['channel_id']).encode('gbk'))

        try:
            request_order = request['order_list'][0]
            result = request_order['fail_reason']
            self.up_back_result = self.RESULT_MAP.get(result, result)
            master = self.master

            order_id = master.get('map:aspire:%s' % request_order['order_transaction_id'])
            if order_id is None:
                raise RuntimeError('order_id is None')
            else:
                request_log.info(
                        'CALLBACK %s - %s' % (self.request.uri, self.request.body.decode('gbk').replace('\n', '')),
                        extra={'orderid': order_id})

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

            master.expire('map:aspire:%s' % request_order['order_transaction_id'], 3600)

        except Exception as e:
            request_log.info('CALLBACK %s - %s' % (self.request.uri, self.request.body),
                             extra={'orderid': order_id})
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()

    def produce_response_body(self, transaction_id, channel_id):
        resp_code = "0000"
        # if channel_id != self.CHANNEL_ID:
        #    resp_code = "0001"

        body = self.RESPONSE.format(
                TransactionId=transaction_id,
                RspCode=resp_code
        )

        return body

    def parse_request(self, request):
        transaction_id = None
        channel_id = None
        order_list = []

        try:
            root = ET.fromstring(request)
            transaction_id = root.find('TransactionId').text
            channel_id = root.find('ChannelId').text

            l = root.findall('.//OrderList/OrderInfo')
            for order in l:
                order_transaction_id = order.find('OrderTransactionId').text
                channel_order_id = order.find('ChannelOrderId').text
                impp_order_id = order.find('ImppOrderId').text
                order_time = order.find('OrderTime').text
                order_status = order.find('OrderStatus').text
                fail_reason = order.find('FailReason').text
                detail_info = None
                if order.find('DetailInfo'):
                    detail_info = order.find('DetailInfo').text

                order_list.append(
                        {
                            'order_transaction_id': order_transaction_id,
                            'channel_order_id': channel_order_id,
                            'impp_order_id': impp_order_id,
                            'order_time': order_time,
                            'order_status': order_status,
                            'fail_reason': fail_reason,
                            'detail_info': detail_info,
                        }
                )

        except Exception as e:
            print("CallbackAspireHandler parse_request exception:", e)

        return {
            'transaction_id': transaction_id,
            'channel_id': channel_id,
            'order_list': order_list,
        }
