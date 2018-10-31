# -*- coding:utf-8 -*-
import requests
import base64
import datetime
import hashlib
import json
import struct
from tornado.httpclient import HTTPClient
import sys

def get_now_date_str():
    """
    获取当前日期字符串 格式"20101010121212"
    """
    t = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    return t

def md5(str):
    md5=hashlib.md5(str.encode('utf-8')).hexdigest()
    return(md5)

def send_sms(phone, content):
    """
    发送短信
    :param phone:
    :param content:
    :return:
    """
    account = "quxun"
    password = "quxun"
    time_str = get_now_date_str()
    token = md5("%s%s%s" % (account, time_str, password))
    url = "http://123.57.48.46:28080/chif10/mtsms/%s/%s" % (account, token)
    phone_list = [phone]
    body = {
        "Dest_terminal_Id": phone_list,
        "Msg_Content": list(bytearray(content, "GBK")),
        "Registered_Delivery": "1",
        "Msg_Fmt": "15",
        "Msg_level": "9",
    }
    authorization = base64.b64encode(("%s:%s" % (account, time_str)).encode())
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json;charset=utf-8",
        "Authorization": authorization,
    }
    http_client = HTTPClient()
    response = http_client.fetch(url, method='POST',headers = headers, body=json.dumps(body), request_timeout=120)
    print(response.body.decode())

if __name__ == '__main__':
#    send_sms('13952042913', u'【流量充值】您好！您充值10M流量已生效，流量有效期以您的账期为准。')
    send_sms('18655590095', u'【流量充值】您好！您充值10M流量已生效，流量有效期以您的账期为准。')
