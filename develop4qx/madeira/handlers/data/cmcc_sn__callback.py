# encoding: utf-8
import json
import logging
import xml.etree.ElementTree as ET
import time

import tornado.gen
from handlers import signature64

from handlers.core import CoreHandler

request_log = logging.getLogger("madeira.request")

RESULT_MAP = {
    '0': '1',
    '2': '9',
}


class CallbackCmccSnHandler(CoreHandler):
    @tornado.gen.coroutine
    def post(self):

        try:
            body = self.request.body.decode()
            root = json.loads(body)

            self.finish('{"resultCode":"0000","resultMsg":"成功"}')

            for res in root.get('resList'):

                seq_no = res.get('channelSeqNo')
                res_code = res.get('resCode')
                oper_seq = res.get('operSeq', '')

                order_id = self.master.get('map:cmcc-sn:%s' % seq_no)

                request_log.info('CALLBACK %s - %s' % (self.request.uri, body.replace('\r\n', '')),
                                 extra={'orderid': order_id})

                if not self.master.sismember('list:create', order_id):
                    request_log.error('ORDER IS BACK ALREADY', extra={'orderid': order_id})
                    continue

                result = RESULT_MAP.get(res_code)

                if result is None:
                    request_log.error('UNKNOWN RESCODE %s', res_code, extra={'orderid': order_id})
                    continue

                handler = CmccSnSingleHandler(self.application, self.request)
                yield handler.by_order(order_id, result, oper_seq)

                self.master.expire('map:cmcc-sn:%s' % seq_no, 3600)

        except Exception as e:
            request_log.exception('CALLBACK FAIL %s', self.request.body)


class CmccSnSingleHandler(CoreHandler):
    @tornado.gen.coroutine
    def by_order(self, order_id, result, oper_seq):
        master = self.master

        try:
            self.up_back_result = result

            stage = self.restore_order(order_id)

            # checking callback
            user = self.application.config['upstream'][self.route]
            if user is None:
                request_log.error('INVALID CALLBACK', extra={'orderid': order_id})
                return

            up_back_time = time.localtime()

            master.hmset('order:%s' % order_id, {
                'up_back_result/%d' % stage: self.up_back_result,
                'up_back_time/%d' % stage: time.mktime(up_back_time),
                'up_order_id/%d' % stage: oper_seq
            })

        except Exception as e:
            request_log.info('restore order info error %s', e, extra={'orderid': order_id})
            return

        if self.up_back_result == '1':
            self.callback('1')
        else:
            yield self.dispatch()
