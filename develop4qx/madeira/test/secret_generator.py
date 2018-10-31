import base64
import os
import urllib.parse

import onetimepass as otp
from tornado.httpclient import HTTPClient


def generate_key():
    b = os.urandom(10)
    key = base64.b32encode(b).decode('ascii')
    return key


# print(generate_key())

def valid(token, secret):
    return otp.valid_totp(token, secret)


def post():
    token = otp.get_totp('UWFR72OSH6B4CZCE')

    body = urllib.parse.urlencode({
        'user_id': 100001,
        'operator': 'wangtao',
        'value': 1,
        'notes': '加',
        'token': token
    })

    http_client = HTTPClient()
    response = http_client.fetch('http://localhost:8899/admin/book', method='POST', body=body)
    print('OUTPUT=' + response.body.decode('utf8'))
    http_client.close()

if __name__ == "__main__":
    # print(valid('674533', 'UWFR72OSH6B4CZCE'))
    # print()
    post()