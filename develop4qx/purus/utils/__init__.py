import hashlib

__author__ = 'Kevin'


def signature(part):
    m = hashlib.md5()
    m.update(part.encode())
    return m.hexdigest().upper()
