import logging
import tornado.web

log = logging.getLogger("request")

class ReloadHandler(tornado.web.RequestHandler):
    def get(self):
        log.info('ACCESS RELOAD (%s)', self.request.remote_ip)
        if self.request.remote_ip not in ['127.0.0.1', '::1']:
            return self.send_error(403)

        try:
            self.application.load_config()
            log.exception('RELOAD CONFIG SUCCESS')
        except Exception as e:
            log.exception('RELOAD FAIL EXCEPTION')
            return self.finish('RELOAD FAIL %s' % repr(e))

        self.finish("RELOAD CONFIG SUCCESS")
