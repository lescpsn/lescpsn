import netifaces
# md5码
import hashlib
#
import base64

#获取本机IP
def get_local_ip():
    results = []
    for i in netifaces.interfaces():
        info = netifaces.ifaddresses(i)
        if netifaces.AF_INET  in info:
            results.append(info[netifaces.AF_INET][0]['addr'])

    return results

#求字符串的MD5码
def get_str_md5(str):
    md5=hashlib.md5(str.encode('utf-8')).hexdigest()
    return(md5)

aaa=get_str_md5('qxxun')
print(aaa)
