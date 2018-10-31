import tornado

from handlers.cloud import des3_encrypt


TEST_KEY = 'bpOfdETMnMSSrsUkQKgXy5AyFOrB65ML'

LOGIN_TEMPLATE = r'''<?xml version="1.0" encoding="utf8"?>
<usr_auth>
 <secKey>{sec_key}</secKey>
 <error_code>0</error_code>
 <error_detail>成功</error_detail>
</usr_auth>'''


class CloudLoginHandler(tornado.web.RequestHandler):
    def post(self):
        cookie = ''
        sec_key = des3_encrypt('lOGINkEY', TEST_KEY).decode()
        response = LOGIN_TEMPLATE.format(sec_key=sec_key)

        self.set_cookie('Auth', 'EE5zThSIjGXCEsCCveLyB3OqZgrdHcoU')
        self.finish(response)

