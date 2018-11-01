import binascii
import os
import random
import string

import time


def token(size):
    return binascii.hexlify(os.urandom(size)).decode("utf8")


def gen_key(size, chars=None):
    if chars is None:
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits

    return ''.join(random.choice(chars) for _ in range(size))


if __name__ == '__main__':
    print('key', gen_key(16, string.ascii_uppercase + string.ascii_lowercase + string.digits))
    print('iv ', gen_key(16, string.digits))

    # for _ in range(11):
    #     print(' ', gen_key(16, string.ascii_lowercase + string.digits))

    print(gen_key(32, string.ascii_uppercase + string.ascii_lowercase + string.digits))

    print('otpauth://totp/Label:user@example.com?secret=%s&issuer=Label' % gen_key(16, string.ascii_uppercase))
