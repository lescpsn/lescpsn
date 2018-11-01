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

# openssl x509 -inform pem -in jszt.pem -pubkey -noout

JSCT_PUBLIC_KEY = r'''-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCHZKWrWXPBIMzdZLzcuZ2uVU+9
TYV8qLCiQ61azRPboO62p1ZLaSXiZsasE6DGT+yDKx84nDESRJM8pSpc7sT36omm
TmjVPe4TwGhCCU4GYbLNIK6cxBy3uwEt7pb90+nO843OgXAXeJtglQQD1GB/0+M5
N99GouhTwga2n3oIbQIDAQAB
-----END PUBLIC KEY-----'''

length = 117


def to_para(plain):
    # Initialize RSA key
    rsa_key = RSA.importKey(JSCT_PUBLIC_KEY)

    cipher = PKCS1_v1_5.new(rsa_key)

    x = plain.encode('gbk')
    print('ENCODE LEN', len(x))

    b = bytearray()

    for i in range(0, len(x), length):
        s = x[i:i + length]
        s = cipher.encrypt(s)
        b += s

    return base64.b64encode(b)
