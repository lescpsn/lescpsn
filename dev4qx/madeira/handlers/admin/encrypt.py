import codecs
import hashlib
import hmac
from Crypto.Cipher import AES

__author__ = 'Kevin'

BS = 16


def pkcs7(bytestring, k=16):
    """
    Pad an input bytestring according to PKCS#7

    """
    l = len(bytestring)
    val = k - (l % k)
    return bytestring + bytearray([val] * val)


def pad_bytes(s):
    return s + bytes([(BS - len(s) % BS)]) * (BS - len(s) % BS)


def decode_hex(key):
    return codecs.decode(key, 'hex_codec')


def hmac_sha256(key, message):
    key = decode_hex(key)
    message = message.encode('utf8')

    digest = hmac.new(key, message, hashlib.sha256).hexdigest().upper()

    return digest


def map_to_string(sys_param, busi_param, key):
    msg = key
    sys_param['content'] = busi_param

    for k in sorted(sys_param.keys()):
        msg += k + sys_param[k]

    msg += key

    return msg


def openplatform_sign(sys_param, busi_param, key):
    msg = map_to_string(sys_param, busi_param, key)
    return hmac_sha256(key, msg)


def aes(message, key):
    key = decode_hex(key)
    cipher = AES.AESCipher(key, AES.MODE_ECB)
    encrypted = cipher.encrypt(pkcs7(message.encode()))
    hex = codecs.encode(encrypted, 'hex_codec')
    return hex.decode().upper()


if __name__ == '__main__':
    key = 'edf3def8681986d00cf19e654e2f9150'

    sys_param = {"method": "CUST_QRY_CUST_INFO",
                 "format": "json",
                 "timestamp": "20150702164343",
                 "appId": "501300",
                 "appKey": "f575e386e80d4cb634c2e9ae0b7b541a",
                 "version": "1.0",
                 "accessToken": "5801b0d7-013f-400e-bee8-59f7ac074880"}

    busi_param = '{"REGION_ID":"A","CERT_TYPE":"2","CERT_NO":"1234567"}'
    busi_param = aes(busi_param, '501e3f2e8bd3c8b0bad3e16b795dd85b')

    sys_param['content'] = busi_param

    print(openplatform_sign(sys_param, busi_param, key))
