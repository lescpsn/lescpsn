# -*- coding: utf-8 -*-
import logging
import tornado
import tornado.web
import tornado.gen
from datetime import datetime as dt
from core.send import send_by_sms
from core.send import send_by_email

request_log = logging.getLogger("ms.request")

@tornado.gen.coroutine
def subscrible_direct(application, msg_type):
    conn = application.conn
    db = conn.messagepush
    result = yield db.message.find({'type': msg_type, 'processing_time': {'$exists': False}}).to_list(None)
    for info_message in result:
        print(info_message)
        # 直接生成用户消息，存入mongodb
        msg_id = info_message['_id']
        msg = info_message['msg']
        request_log.info('原始消息 %s %s', msg_id, msg)
        t = yield db.user_subscribe.find({'type': msg_type}).to_list(None)
#        for subscribe_message in db.user_subscribe.find({'type': msg_type}):
        for subscribe_message in t:
            print(subscribe_message)
            sub_id = subscribe_message['_id']
            operator_id = subscribe_message['operator_id']
            handling = subscribe_message['handling']

            request_log.info('Subscribe_Message %s %s %s', sub_id, operator_id, handling)

            msg_list = []
            msg_list.append({
                'msg_id': msg_id,
            })
            info_user_message = {
                'operator_id': operator_id,
                'msg_list': msg_list,
                'sub_id': sub_id,
            }
            user_message_id = db.user_message.save(info_user_message)

            # 更新message，增加 processing_time
            processing_time = dt.now()
            db.message.update({'_id': msg_id}, {"$set": {'processing_time': processing_time}})

            for handler in handling:
                if handler['handler'] == 'email':
                    yield send_by_email(application, msg, handler)
                elif handler['handler'] == 'sms':
                    yield send_by_sms(application, msg, handler)
                elif handler['handler'] == 'weixin':
                    yield send_by_weixin(application, msg, handler)

            read_time = dt.now()
            db.user_message.update({'_id': user_message_id}, {"$set": {'send_time': read_time}})
