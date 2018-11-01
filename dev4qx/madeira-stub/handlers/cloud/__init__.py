import base64

from Crypto.Cipher import DES3

__author__ = 'Kevin'


def pad(s):
    return s + (8 - len(s) % 8) * bytes([8 - len(s) % 8])


def unpad(s):
    return s[0:-ord(s[-1])]


def des3_encrypt(text, key):
    key = base64.b64decode(key)

    cipher = DES3.new(key, DES3.MODE_ECB)

    plaintext = text.encode()
    e = cipher.encrypt(pad(plaintext))

    return base64.b64encode(e)


def des3_decrypt(text, key):
    key = base64.b64decode(key)

    cipher = DES3.new(key, DES3.MODE_ECB)

    encrypted = base64.b64decode(text)
    plaintext = cipher.decrypt(encrypted)
    return unpad(plaintext.decode())
