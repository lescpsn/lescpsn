# -*- coding: utf-8 -*-
import logging
import tornado
from core.subscribe import subscrible_direct

request_log = logging.getLogger("ms.request")

class SubscribeTask(tornado.ioloop.PeriodicCallback):
    def __init__(self, application, callback_time):
        super(SubscribeTask, self).__init__(self.run, callback_time)
        self.application = application
        self.master = self.application.sentinel.master_for('madeira')

    @tornado.gen.coroutine
    def run(self):
        # TODO: try
        try:
            r = self.master
            # TODO: return types is empty
            types = r.smembers('types')
            if types is None:
                self.finish('type空')
            elif types is not None:
                msg_type = r.spop('types')
                func = self.application.config['subscrible'].get(msg_type)
                request_log.info('GET TASK_MESSAGE %s %s %s', types, msg_type, func)
                
                if func == 'direct':
                    yield subscrible_direct(self.application, msg_type)
        except:
            request_log.exception('FAIL')

