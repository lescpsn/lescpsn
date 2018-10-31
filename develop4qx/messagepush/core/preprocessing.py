# -*- coding: utf-8 -*-
import json
import logging
import tornado
import tornado.gen
import tornado.web

request_log = logging.getLogger("ms.request")

@tornado.gen.coroutine
def preprocessing(application):
    # TODO: try
    try:
        master = application.sentinel.master_for('madeira')
        msg_id = master.rpop('ready')  # 从list:ready取一个msg_id
        type = master.hget('message:{0}'.format(msg_id), 'type')  # 从redis获取tpye
        func = application.config['preprocessing'].get(type)  # 根据type，从config读取对应的预处理函数

        request_log.info('GET MESSAGE %s %s %s', msg_id, type, func)

        if func == 'direct':
            yield preprocessing_direct(application, msg_id, type)

    except:
        request_log.exception('FAIL')


@tornado.gen.coroutine
def preprocessing_direct(application, msg_id, type):
    # TODO: try
    try:
        master = application.sentinel.master_for('madeira')
        master.sadd('types', type)  # 将消息类型放到 set:types
        info = master.hgetall('message:{0}'.format(msg_id))
        print(info)
        # 直接将消息持久化到MongoDB
        info['_id'] = msg_id
        info['payload'] = json.loads(info['payload'])
        conn = application.conn
        db = conn.messagepush
        db.message.save(info)
        master.expire('message:{0}'.format(msg_id), 3600)
    except:
            request_log.exception('FAIL')

