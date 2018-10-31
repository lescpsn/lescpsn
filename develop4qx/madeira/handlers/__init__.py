import base64
import hashlib
import random
import string

import tornado.web


def signature64(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode())
    return base64.b64encode(m.digest()).decode()


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode('utf8'))
    return m.hexdigest().upper()


def gen_key(size, chars=None):
    if chars is None:
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits

    return ''.join(random.choice(chars) for _ in range(size))


class HealthFilter:
    def __init__(self):
        print('health filter inited')

    def filter(self, record):
        if record.args and record.args[1] and record.args[1].startswith('HEAD'):
            return False
        return True


class ErrorHandler(tornado.web.RequestHandler):
    def head(self):
        self.finish()

    def get(self):
        self.finish()

    def post(self):
        self.finish()


class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(BaseHandler, self).__init__(application, request)
        self._master = None
        self._slave = None

    @property
    def classifier(self):
        return self.application.classifier

    @property
    def master(self):
        if self._master is None:
            self._master = self.application.sentinel.master_for('madeira')
        return self._master

    @property
    def slave(self):
        if self._slave is None:
            self._slave = self.application.sentinel.slave_for('madeira')
        return self._slave

    def log(self):
        self.application.log_request()


# upstream handler
# cmcc
from handlers.data.cmcc_states import up_cmcc_states
from handlers.data.cmcc import up_cmcc
from handlers.data.aspire import up_aspire
from handlers.data.cmcc_sn import up_cmcc_sn
from handlers.data.aspire_ec import up_aspire_ec
from handlers.data.aspire_ec2 import up_aspire_ec2
from handlers.data.cmcc_ha import up_hacmcc
from handlers.data.migu import up_migu
from handlers.data.migu_huawei import up_migu_huawei
from handlers.data.cmcc_snbj import up_cmcc_snbj
from handlers.data.llreader import up_llreader
from handlers.data.gmall import up_gmall
from handlers.data.ibumobile import up_ibumobile
from handlers.data.faliuliang2 import up_faliuliang2
from handlers.data.trafficweb import up_trafficweb
from handlers.data.idatafocus import up_idatafocus
from handlers.data.cmcc_sx import up_cmcc_sx
from handlers.data.suopai import up_suopai
from handlers.data.yucheng import up_yucheng
from handlers.data.lemian import up_lemian



# unicom
from handlers.data.wo import up_wo
from handlers.data.xiaowo import up_xiaowo
from handlers.data.bitfeng import up_bitfeng
from handlers.data.shangtong import up_shangtong

# telecom
from handlers.data.data21cn import up_21cn
from handlers.data.telecom_js import up_telecom_js
# upstream
from handlers.data.quxun import up_quxun
from handlers.data.legend import up_legend
from handlers.data.xicheng import up_xicheng
from handlers.data.mopote import up_mopote
from handlers.data.niukou import up_niukou
from handlers.data.ruanyunbi import up_ruanyunbi
from handlers.data.raiyi import up_raiyi
from handlers.data.dahanfc import up_dahanfc
from handlers.data.llfengbao import up_llfengbao
from handlers.data.yflow import up_yflow
from handlers.data.xiamen_zyt import up_xiamen_zyt
from handlers.data.zhjxzy import up_zhjxzy
from handlers.data.yangchan import up_yangchan
from handlers.data.zhixin import up_zhixin
from handlers.data.people import up_people
from handlers.data.telecom_gz import up_telecom_gz
from handlers.data.ibumobile2 import up_ibumobile2

# fee
from handlers.fee.standard import up_standard
from handlers.fee.yuechen import up_yuechen
from handlers.fee.esai import up_esai
from handlers.fee.fengyun import up_fengyun
from handlers.fee.jinfeng import up_jinfeng
from handlers.fee.jiebei import up_jiebei


