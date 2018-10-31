from io import BytesIO
import random

import tornado.web
from wheezy.captcha.image import captcha, smooth
from wheezy.captcha.image import background
from wheezy.captcha.image import curve
from wheezy.captcha.image import noise
from wheezy.captcha.image import rotate
from wheezy.captcha.image import text
from wheezy.captcha.image import offset
from wheezy.captcha.image import warp
from handler import BaseHandler


class CaptchaHandler(BaseHandler):
    def get(self):
        temp_uid = self.get_cookie('_t')
        if not temp_uid:
            print('NO COOKIE!!!')
            self.finish()
            return

        # num = ''.join(random.sample('acdefghkmnprstuvwxyABCDEFGHKMNPRSTUVWXY345678', 4))
        num = ''.join(random.sample('1234567890', 4))

        print('CAPTCHA: [%s:%s]' % (temp_uid, num))
        self.master.setex('captcha:' + temp_uid, 60, num)

        captcha_image = captcha(drawings=[
            # background(),
            text(fonts=[
                # 'fonts/Lobster_Two/LobsterTwo-BoldItalic.ttf',
                'fonts/Special_Elite/SpecialElite.ttf'
            ],
                 drawings=[
                     warp(),
                     rotate(),
                     offset()
                 ]),
            curve(),
            noise(),
            smooth(),
        ], width=300)

        image = captcha_image(num)
        fp = BytesIO()
        image.save(fp, 'JPEG', quality=60)

        fp.seek(0)

        self.set_header("Content-type", "image/jpeg")
        self.write(fp.read())
        self.finish()
