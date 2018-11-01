# coding=utf8
import hashlib
import logging
import logging.config
import time
import tornado.httpserver
import tornado.ioloop
import tornado.web
import yaml
from tornado.httpclient import AsyncHTTPClient

LOGO = r'''
   _____              .___     .__                    /\         .__       .__            __                   __
  /     \ _____     __| _/____ |__|___________       / /   _____ |__| ____ |__|         _/  |_  ____   _______/  |_
 /  \ /  \\__  \   / __ |/ __ \|  \_  __ \__  \     / /   /     \|  |/    \|  |  ______ \   __\/ __ \ /  ___/\   __\
/    Y    \/ __ \_/ /_/ \  ___/|  ||  | \// __ \_  / /   |  Y Y  \  |   |  \  | /_____/  |  | \  ___/ \___ \  |  |
\____|__  (____  /\____ |\___  >__||__|  (____  / / /    |__|_|  /__|___|  /__|          |__|  \___  >____  > |__|
        \/     \/      \/    \/               \/  \/           \/        \/                        \/     \/
A tributary of Amazon
(C) 2016, Quxun Network
'''

LOGGING_CONFIG = r'''version: 1
root:
  level: DEBUG
  handlers: [request, console]
formatters:
  simple:
    format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
handlers:
  console:
    class: logging.StreamHandler
    level: DEBUG
    formatter: simple
  request:
    class: logging.handlers.TimedRotatingFileHandler
    level: DEBUG
    formatter: simple
    filename: 'ops.log'
    when: 'midnight'
    interval: 1
    backupCount: 120
    encoding: 'utf8'
'''

MOBILE = '18822972877'
USER_ID = '100001'
KEY = 'O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM'
FEE_URL = 'http://fee.e7chong.com:8899/order.do'
BACK_URL = 'http://test.e7chong.com:9999/callback'

request_log = logging.getLogger()


class MiniHandler(tornado.web.RequestHandler):
    def get(self):
        if self.request.remote_ip not in ['127.0.0.1', '::1']:
            return self.send_error(500)

        tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())
        order_id = 'MINITEST%s' % tsp

        q = 'userid={user_id}&price={price}&num=1&mobile={mobile}&spordertime={tsp}&sporderid={order_id}'.format(
            user_id='100001',
            price=1,
            mobile=MOBILE,
            tsp=tsp,
            order_id=order_id)

        m = hashlib.md5()
        m.update((q + '&key=' + KEY).encode())
        sign = m.hexdigest().upper()

        body = '{query}&sign={sign}&back_url={back_url}'.format(query=q, sign=sign, back_url=BACK_URL)

        request_log.info('CALL %s - %s' % (FEE_URL, body))

        http_client = AsyncHTTPClient()

        try:
            response = yield http_client.fetch(FEE_URL, method='POST', body=body)

            body = response.body.decode('gbk')
            request_log.info(body)

        except Exception:
            request_log.exception('FAIL')

        finally:
            http_client.close()

    def post(self):
        """
        print callback info
        """
        print('CALLBACK %s - %s' % (self.request.uri, self.request.body.decode()))
        self.finish()


class Application(tornado.web.Application):
    def __init__(self):
        cfg = yaml.load(LOGGING_CONFIG)
        logging.config.dictConfig(cfg)

        handlers = [(r"/*", MiniHandler), ]
        settings = dict(debug=True)

        tornado.web.Application.__init__(self, handlers, **settings)


if __name__ == "__main__":
    port = 9999
    print(LOGO)
    http_server = tornado.httpserver.HTTPServer(Application(), xheaders=True)
    http_server.listen(port)
    print('Listen on http://localhost:%d' % port)
    tornado.ioloop.IOLoop.instance().start()
