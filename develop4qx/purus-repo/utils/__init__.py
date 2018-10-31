from _sha1 import sha1
import hashlib
import hmac

__author__ = 'Kevin'


def signature(part):
    m = hashlib.md5()
    m.update(part.encode())
    return m.hexdigest().upper()


def sign_request(raw):
    key = "840c8329a96034aa24304d7".encode()
    return hmac.new(key, raw, sha1).hexdigest()

