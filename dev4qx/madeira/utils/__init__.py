__author__ = 'Kevin'

BS = 16


def pad_bytes(s):
    return s + bytes([(BS - len(s) % BS)]) * (BS - len(s) % BS)
