#!/usr/bin/env python3
# -*- coding:utf-8 -*-
import json
from datetime import datetime
from tornado.httpclient import HTTPClient


CorpID = 'wx204b50bf53483070'
Secret = 'MVaC618E6TweViKvYYwSB3QMvCq9RL5UZKMK_vfI_vhspgDRKL4CSFIcldBqHq4e'

class  accessToken(object):
    def __init__(self, corpid, corpsecret):
        self.baseurl = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={0}&corpsecret={1}'.format(corpid, corpsecret)

    def get_accesstoken(self):
        http_client = HTTPClient()
        response = http_client.fetch(self.baseurl, method='GET', request_timeout=120)
        response_body = json.loads(response.body.decode())
        '''
        根据response_body返回值求出self.access_token, self.expires_in
        '''
        self.access_token = response_body.get("access_token")
        self.expires_in = response_body.get("expires_in")

        return self.access_token

def send_weixin(title, content):
    print("weixin_send_msg start...")
    corpid = "corpid_test"
    corpsecret = "corpsecret_test"

    '''
    调用接口方法获取access_token
    '''
    access_token=accessToken(corpid=CorpID, corpsecret=Secret).get_accesstoken()
    url = 'https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={0}'.format(access_token)

    payload = {
        "touser": "",
        "toparty": "3",
        "totag": "",
        "msgtype": "text",
        "agentid": 1,
        "text": {
            "content": "title:{0}\ncontent:{1}".format(title, content)
        },
        "safe":"0"
    }

    payload = json.dumps(payload)
    print(payload)
    http_client = HTTPClient()
    response = http_client.fetch(url, method='POST', body=payload, request_timeout=120)
    print(response.body.decode())
    print("weixin_send_msg end...")

if __name__ == "__main__":
    content = datetime.now()
    title = datetime.now()
    send_weixin(title, content)
