# -*- coding: utf-8 -*-
import logging
import tornado
import tornado.web
import tornado.gen
from core.mail import send_mail
from core.weixin import send_weixin
from core.sms import send_sms

request_log = logging.getLogger("ms.request")


# 调用蝶信接口，发送短信
@tornado.gen.coroutine
def send_by_weixin( application, msg, handler):
    title = datetime.now()    
    content = datetime.now()
    yield send_weixin(title, content) 

# 调用蝶信接口，发送短信
@tornado.gen.coroutine
def send_by_sms( application, msg, handler):
    phone="18655590095"
    yield send_sms(phone, msg)

 # 调用邮件发送接口，发送邮件通知
@tornado.gen.coroutine
def send_by_email(application, msg, handler):
    send_account = 'chj@e7chong.com'
    send_password = 'Che$123'
    send_smtp_address = 'smtp.exmail.qq.com'
    send_smtp_port = 465
    rev_list = [handler['address']]
    mail_title = '消息中心'
    mail_text = msg
    mail_file_list = ['/home/carhj/npm-debug.log']

    yield send_mail(application, send_account, send_password, send_smtp_address, send_smtp_port, rev_list, mail_title, mail_text, mail_file_list )



