import binascii
import os
import random
import string


def token(size):
    return binascii.hexlify(os.urandom(size)).decode("utf8")


def gen_key(size, chars=None):
    if chars is None:
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits

    return ''.join(random.choice(chars) for _ in range(size))


if __name__ == '__main__':
    print(gen_key(16, string.ascii_uppercase + string.ascii_lowercase + string.digits))

    print(gen_key(16, string.digits))

    print(gen_key(32, string.ascii_uppercase + string.ascii_lowercase + string.digits))