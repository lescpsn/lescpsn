# -*- coding: utf-8 -*-
import logging
import json
import tornado.web
import tornado.gen
from datetime import datetime as dt
from core.preprocessing import preprocessing

request_log = logging.getLogger("ms.request")

class InboxHandler(tornado.web.RequestHandler):
    # 对传入的消息报文验证合法性?
    @tornado.gen.coroutine
    def post(self):
        request_body = self.request.body.decode()
        request_log.info('INBOX %s', request_body)
        try:
            master = self.application.sentinel.master_for('madeira')
            body = json.loads(request_body)
            msg = body.get('msg')
            type = body.get('type')
            payload = body.get('payload')
            create_date = dt.now()
            msg_id = master.incr('msg_id', 1)
            map = {
                'msg': msg,
                'type': type,
                'payload': json.dumps(payload),
                'create_date': create_date
            }

            master.hmset('message:{0}'.format(msg_id), map)
            master.lpush('ready', msg_id)
            yield preprocessing(self.application)
        except:
            request_log.exception('FAIL')
