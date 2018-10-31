import hashlib

__author__ = 'Kevin'

BS = 16


def to_md5(part):
    m = hashlib.md5()
    m.update(part.encode('utf8'))
    return m.hexdigest()


def padding(s):
    return s + (BS - len(s) % BS) * chr(BS - len(s) % BS)


def signature(part):
    m = hashlib.md5()
    m.update(part.encode())
    return m.hexdigest().upper()


if __name__ == '__main__':
    print(to_md5('22323213213'))
    print(to_md5('700267'))
