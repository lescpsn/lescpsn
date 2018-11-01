import base64

from Crypto.Cipher import AES


def pad(s):
    return s + (16 - len(s) % 16) * chr(16 - len(s) % 16)


passphrase = 'K4QqPQ5qgfplctwu'
iv = '4315940702106812'

input = '4s+oMGSW7G0PrY0eGKBrNknFj02VIra//tyGBc8m/X5u6a7DWO9HID59JD34Tasp4kX9ovIKEUg8' + \
        'gj4hkKpgR4Olcchrk86kvs0o56gqHXvzDAQC7quQTUfB3GEC4rRgn0YKc+bdDd4hnbYGPR0b1Le8' + \
        'qWnxyN43sOklOiun3ngrg6O9V3LNU9MKpR+vQ0muDkVYELn0aCKuTZx9Zkmbv9h06MyTcxaUvwzf' + \
        'n2H/lCwlzQGY7G6VdkzVaaD6bS8+0yrLnKS6QQiWpCpDv4IzqQ=='

aes = AES.new(passphrase, AES.MODE_CBC, iv)
encrypted = aes.decrypt(base64.b64decode(input))

print(encrypted)

r = '{"timestamp":"1415933639511","facevalue":"2","request_no":"1415933639511","plat_offer_id":"YLC00000100A","phone_id":"18922426018","contract_id":"100001","order_id":"1415933639511","partner_no":"101103"}'

aes = AES.new(passphrase, AES.MODE_CBC, iv)
b = aes.encrypt(pad(r))
encrypted = base64.b64encode(b).decode('utf8')
print(encrypted)