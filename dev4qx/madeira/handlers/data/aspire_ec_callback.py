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


class CallbackAspireECHandler(CoreHandler):
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

        order_id = None

        try:
            master = self.master

            OperSeq = re.search(r'<OperSeq>(.*)</OperSeq>', request_info).groups()[0]
            order_id = master.get('map:aspire_ec:%s' % OperSeq)
            if order_id is None:
                raise RuntimeError('order_id is None')
            else:
                request_log.info(
                    'CALLBACK %s - %s' % (self.request.uri, request_info),
                    extra={'orderid': order_id})

            if request_info.find('<FailNum>1</FailNum>') != -1:
                self.up_back_result = '99'

                err_code = re.search(r'<Rsp>(.*)</Rsp>', request_info)
                if err_code and len(err_code.groups()):
                    self.up_back_result = err_code.groups()[0]

            elif request_info.find('<SuccNum>1</SuccNum>') != -1:
                self.up_back_result = '1'

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

            master.expire('map:aspire_ec:%s' % OperSeq, 3600)

        except Exception as e:
            request_log.error('CALLBACK %s - %s' % (self.request.uri, request_info),
                              extra={'orderid': order_id})
            request_log.exception('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            master.set('aspire_ec:mobile:%s' % self.mobile, datetime.now().strftime("%Y%m"))
            self.callback('1')
        else:
            yield self.dispatch()
