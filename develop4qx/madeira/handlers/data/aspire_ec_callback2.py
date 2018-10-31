# coding=utf8
from datetime import datetime
import logging
import time
import re

import tornado

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

ORDER_RESP_FORMAT = '''
<?xml version="1.0" encoding="utf-8"?>
<InterBOSS>
    <Version>0100</Version>
    <TestFlag>1</TestFlag>
    <BIPType>
        <BIPCode>{BIPCode}</BIPCode>
        <ActivityCode>{ActivityCode}</ActivityCode>
        <ActionCode>1</ActionCode>
    </BIPType>
    <RoutingInfo>
        <OrigDomain>STKP</OrigDomain>
        <RouteType>00</RouteType>
        <Routing>
            <HomeDomain>BBSS</HomeDomain>
            <RouteValue>998</RouteValue>
        </Routing>
    </RoutingInfo>
    <TransInfo>
        <SessionID>{SessionID}</SessionID>
        <TransIDO>{TransIDO}</TransIDO>
        <TransIDOTime>{TransIDOTime}</TransIDOTime>
        <TransIDH>{TransIDH}</TransIDH>
        <TransIDHTime>{TransIDHTime}</TransIDHTime>
    </TransInfo>
    <Response>
        <RspType>0</RspType>
        <RspCode>0000</RspCode>
        <RspDesc>Success</RspDesc>
    </Response>
</InterBOSS>
'''


def search_value(pattern, s):
    m = re.search(pattern, s)
    if m:
        return m.group(1)

    return ''


@tornado.gen.coroutine
def do_aspire_ec_order_result(order_handler, order_id, up_back_result):
    stage = order_handler.restore_order(order_id)

    # checking callback
    user = order_handler.application.config['upstream'][order_handler.route]
    if user is None:
        request_log.error('do_aspire_ec_order_result INVALID CALLBACK', extra={'orderid': order_id})
        return

    up_back_time = time.localtime()

    order_handler.up_back_result = up_back_result

    order_handler.master.hmset('order:%s' % order_id, {
        'up_back_result/%d' % stage: order_handler.up_back_result,
        'up_back_time/%d' % stage: time.mktime(up_back_time)
    })

    if order_handler.up_back_result == '1':
        order_handler.callback('1')
    else:
        yield order_handler.dispatch()


class CallbackAspireEC2Handler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):
        request_body = self.request.body
        request_info = request_body.decode()
        request_info = ''.join(request_info.split())
        # request_log.info('CallbackAspireECHandler %s', request_info, extra={'orderid': ''})

        bip_code = search_value('<BIPCode>(.*)</BIPCode>', request_info)
        activity_code = search_value('<ActivityCode>(.*)</ActivityCode>', request_info)
        session_id = search_value('<SessionID>(.*)</SessionID>', request_info)
        trans_ido = search_value('<TransIDO>(.*)</TransIDO>', request_info)
        trans_ido_time = search_value('<TransIDOTime>(.*)</TransIDOTime>', request_info)

        trans_idh_time = datetime.now().strftime("%Y%m%d%H%M%S")
        trans_idh = trans_idh_time + trans_ido[-12:]

        order_resp = ORDER_RESP_FORMAT.format(
            BIPCode=bip_code,
            ActivityCode=activity_code,
            SessionID=session_id,
            TransIDO=trans_ido,
            TransIDOTime=trans_ido_time,
            TransIDH=trans_idh,
            TransIDHTime=trans_idh_time)

        self.finish(order_resp)

        try:
            OperSeq = search_value('<OperSeq>(\d+)</OperSeq>', request_info)
            request_log.exception('ASPIRE_EC CALLBACK ORDERSEQ [{0}]\n {1}'.format(OperSeq,request_info), extra={'orderid': 'UNKNOWN'})

            success_mobile_list = re.findall(r'<SuccTel>(\d+)</SuccTel>', request_info)
            fail_mobile_list = re.findall(r'<MobNum>(\d+)</MobNum>', request_info)

            all_mobile_list = success_mobile_list + fail_mobile_list

            for mobile in all_mobile_list:
                try:
                    key = 'map:aspire_ec:{0}:{1}'.format(OperSeq, mobile)
                    order_id = self.master.get(key)
                    if order_id:
                        up_back_result = ['1', '99'][mobile in fail_mobile_list]
                        yield do_aspire_ec_order_result(self, order_id, up_back_result)
                        self.master.expire(key, 3600)
                except:
                    request_log.exception('DO ASPIRE_EC CALLBACK EXCEPTION1 ORDERSEQ [{0}]'.format(OperSeq), extra={'orderid': 'UNKNOWN'})
        except:
            request_log.exception('DO ASPIRE_EC CALLBACK EXCEPTION2 ORDERSEQ [{0}]'.format(OperSeq), extra={'orderid': 'UNKNOWN'})
