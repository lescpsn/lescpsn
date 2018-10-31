# encoding: utf-8
import base64
from Crypto.Cipher import PKCS1_v1_5, PKCS1_OAEP

from Crypto.PublicKey import RSA
from tornado.httpclient import HTTPClient

# JSCT_PUBLIC_KEY = r'''-----BEGIN PUBLIC KEY-----
# MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwNOSwhZmnYkAAeEBtIBU
# DmET1EXntyC6n7KTVHG0XnwDRYOJMifhm+9NX+QXD/F4kkO8ue9t7oNMMN7jeFeM
# K1fEjVOCXzLjrSLRxxYooL+SYKzwJD/J8/tIrLQ9nPdfHzz3NKfkgxwzkreh+rwV
# jM7KRnKzN+XyG5Te4TdjzmCSpfEMHDNz2SXAGu+NwykIXaq7yAmIeCCbzbYVifb1
# eS/HVDMPz02icngGGIgu4UuKYgXTR7djoI2fMmqnyLTTlgxfnGyeRD7Q6JTqUoYE
# zzEAAo40i9m9dCOZP4TJxcknrkMnVAhpWsb1v+kOLrgGPxOmP8Ab09ocS9sP05Ym
# 7QIDAQAB
# -----END PUBLIC KEY-----'''

JSCT_PUBLIC_KEY = r'''-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDfDzGUaV00kRklAzfClaNEhyXAG5pT60vAQTXkLdaSJUnomF7tSTm6WSPWz1pXBMMGDff18aE63m/ilJK28uFpkU66imEIylc1gLFfojuE5l1lRutnafDLzMyzrjLTeN1VmgY185tdHN+Tgr00bZO+WhW4ejXARrQWDCOt5FJRLQIDAQAB
-----END PUBLIC KEY-----'''

length = 117


def to_para(plain):
    # Initialize RSA key
    rsa_key = RSA.importKey(JSCT_PUBLIC_KEY)

    cipher = PKCS1_v1_5.new(rsa_key)

    x = plain.encode('gbk')
    #print('ENCODE LEN', len(x))

    b = bytearray()

    for i in range(0, len(x), length):
        s = x[i:i + length]
        s = cipher.encrypt(s)
        b += s

    return base64.b64encode(b)


# def http_send(para):
#     body = 'para=' + para
#     url = 'http://202.102.111.142/jszt/ipauth/orderPackageByQiXin'
#     http_client = HTTPClient()
#     response = http_client.fetch(url, method='POST', body=body, request_timeout=120)
#     print(response.body.decode())
#
#
# PLAIN = ';'.join([
#     'accNbr=15380841844',
#     'offerSpecl=300509026202',
#     'actionCode=order_qixin_001',
#     'goodName=流量优惠/流量赠送（HX）/10M省内流量/当月',
#     'ztInterSource=200186',
#     'reqId=20018620141203102214965252',
#     'staffValue=18151671510',
#     'type=1'])
# print (PLAIN)
# para = to_para(PLAIN).decode()
# print(para)
# http_send(para)
