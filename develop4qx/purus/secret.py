from hashlib import sha1
import hmac
import base64
import json
import os

from Crypto.Cipher import AES


BS = 16


def unpadding(s):
    return s[0:-(s[-1])]


def padding(s):
    return s + (BS - len(s) % BS) * chr(BS - len(s) % BS)


def get_kv():
    s = os.getenv('DOGE')
    return s[0:16], s[-16:]


def sign_request(raw):
    # If you dont have a token yet, the key should be only "CONSUMER_SECRET&"
    key = "840c8329a96034aa24304d7".encode('utf8')

    # The signature
    return hmac.new(key, raw, sha1).hexdigest()


def aes_encrypt(message, kv=None):
    if kv is None:
        key, vi = get_kv()
    else:
        key, vi = kv

    message = padding(message)
    cipher = AES.new(key, AES.MODE_CBC, vi)
    text = cipher.encrypt(message)
    return base64.b64encode(text)


def aes_decrypt(raw, kv=None):
    if kv is None:
        key, vi = get_kv()
    else:
        key, vi = kv

    raw = base64.b64decode(raw)
    cipher = AES.new(key, AES.MODE_CBC, vi)
    b = unpadding(cipher.decrypt(raw))
    return b.decode('utf8')


def load_config():
    encrypted = open('config.bin').read()
    plain = aes_decrypt(encrypted)
    return json.loads(plain)

