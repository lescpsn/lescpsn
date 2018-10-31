import base64
import hashlib
from Crypto.Cipher import AES

#MD5签名
BS = 16
def to_md5(part):
    m = hashlib.md5()
    m.update(part.encode())
    return m.hexdigest()

def md5_signature(part):
    m = hashlib.md5()
    m.update(part.encode())
    return m.hexdigest().upper()

#AES加解密
def padding(s):
    return s + (BS - len(s) % BS) * chr(BS - len(s) % BS)

def unpadding(s):
    return s[0:-ord(s[-1])]

def aes_encrypt(code , passphrase, iv):
    aes = AES.new(passphrase, AES.MODE_CBC, iv)
    b = aes.encrypt(padding(code))
    sign_code = base64.b64encode(b).decode('utf8')
    return  sign_code

def aes_decrypt(code, passphrase, iv):
    aes = AES.new(passphrase, AES.MODE_CBC, iv)
    encrypted = aes.decrypt(base64.b64decode(code))
    decryption_code = unpadding(encrypted.decode('utf8'))
    return  decryption_code
