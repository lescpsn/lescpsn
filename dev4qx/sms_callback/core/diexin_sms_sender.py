# -*- coding: utf-8 -*-
import logging
import calendar
import base64
import json
import hashlib

from tornado import gen
from tornado.httpclient import AsyncHTTPClient
from utils.phone import MobileClassifier
from datetime import datetime

log = logging.getLogger("request")

class DieXinSmsSender:
    ERR_STR = {"00": "多个手机号请求发送成功",
               "02": "IP 限制",
               "03": "单个手机号请求发送成功",
               "04": "用户名错误",
               "05": "密码错误",
               "06": "编码错误",
               "07": "发送时间有误",
               "08": "参数错误",
               "09": "手机号码有误",
               "10": "扩展号码有误",
               "11": "余额不足",
               "-1": "服务器内部异常",
               "REJECT": "非法消息内容",
               }
    SUCCESS_CODE = 0


    def __init__(self, baseurl, username, userpass):
        self.baseurl = baseurl
        self.username = username
        self.userpass = userpass
        self.classifier = MobileClassifier()

    @gen.coroutine
    def send_sms(self, mobile, offer_id, downstream):

        if offer_id not in downstream.get('offer_list'):
            log.info('SKIP OFFER %s', offer_id)
            return

        o, a = self.classifier.search(mobile)
        area = '%s:%s' % (o, a)
        if area not in downstream.get('area_list'):
            log.info('SKIP AREA %s', area)
            return

        product_name = downstream.get('offer_list').get(offer_id)
        template = downstream.get('template')
        str_end_time = None
        if 'end_time' in template:
            end_time = datetime.now()
            month = end_time.month
            year = end_time.year
            day = calendar.monthrange(year, month)[1]
            end_time = end_time.replace(year=year, month=month, day=day)
            str_end_time = "{0}年{1}月{2}日".format(end_time.year, end_time.month, end_time.day)

        content = template.format(packet_name=product_name, end_time=str_end_time)
        yield self.send_sms_driver(mobile, content)

    @gen.coroutine
    def send_sms_driver(self, mobile, content):

        http_client = AsyncHTTPClient()
        try:
            #注意：mobile参数结构是个列表
            username = self.username
            userpass = self.userpass
            baseurl = self.baseurl
            time_str = yield self.get_now_date_str()
            token = yield self.md5("%s%s%s" % (username, time_str, userpass))
            url = "%s/%s/%s" % (baseurl, username, token)
            body = {
                "Dest_terminal_Id": [mobile],
                "Msg_Content": list(bytearray(content, "GBK")),
                "Registered_Delivery": "1",
                "Msg_Fmt": "15",
                "Msg_level": "9",

            }
            authorization = base64.b64encode(("%s:%s" % (username, time_str)).encode())
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=utf-8",
                "Authorization": authorization,

            }

            response = yield http_client.fetch(url, method='POST',headers = headers, body=json.dumps(body), request_timeout=120)
            response_body = response.body.decode()
            log.debug('send sms RESP: {0}.'.format(response_body))
            if response.code == 200:
                resp = json.loads(response_body)
                result_code = resp.get('Rets')[0].get('Rspcode')
                if result_code == self.SUCCESS_CODE:
                    log.debug('send sms  success.')
                else:
                    log.error('send sms  fail {0}({1}).'.format(result_code, self.ERR_STR.get(result_code, 'unknown')))
            else:
                 log.error("send sms  fail get a unknown http response code = {0}".format(response.code))

        except:
            log.exception("DieXinSmsSender send_sms error!!!")

    @gen.coroutine
    def get_now_date_str(self):
        """
        获取当前日期字符串 格式"20101010121212"
        """
        t = datetime.now().strftime("%Y%m%d%H%M%S")
        return t

    @gen.coroutine
    def md5(self, str):
        md5=hashlib.md5(str.encode('utf-8')).hexdigest()
        return(md5)

if __name__ == "__main__":
    end_time = datetime.now()
    month = end_time.month
    year = end_time.year
    day = calendar.monthrange(year, month)[1]
    end_time = end_time.replace(year=year, month=month, day=day)
    end_time.strftime("%Y.%m.%d")
    print(end_time)
