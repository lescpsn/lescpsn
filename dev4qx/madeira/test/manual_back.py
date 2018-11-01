# encoding: utf8
import hashlib
import random
import time


def signature(*parts):
    m = hashlib.md5()
    for p in parts:
        m.update(p.encode('utf8'))
    return m.hexdigest().upper()


# 12-31 00:00 machado.request INFO     - DOWNSTREAM CALLBACK http://121.40.154.48:8899/callback/sk.do -
# userid=100001&orderid=Q2014123100000600102545&sporderid=Q2014123100000600102545&merchantsubmittime=20141231000014&resultno=9&sign=45049AC44A824BEA110C9E1D7804B469
def mback(order, key, result):
    body = 'userid=%s&orderid=%s&sporderid=%s&merchantsubmittime=%s&resultno=%s' % (
        '100001',
        order,
        order,
        time.strftime("%Y%m%d%H%M%S", time.localtime()),
        result)

    sign = signature(body + '&key=' + key)
    body += "&sign=" + sign

    return body


template = 'curl --data "%s" http://localhost:8899/callback/sk.do'


def from_file(file_name, shuffle=True, result='1', key='O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM', template=template):
    order_list = list()
    with open(file_name) as stream:
        for l in stream:
            order_list.append(l.strip()[:23])

    if shuffle:
        random.shuffle(order_list)

    while len(order_list):
        order_id = order_list.pop()
        if shuffle:
            t = random.randrange(3, 30)
        else:
            t = '0.5'
        if len(order_id) == 23:
            print(template % mback(order_id, key, result), '; sleep %s' % t)
        else:
            print()


def from_of_file(key='O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM'):
    sh = open('1.sh', 'w')

    with open('of_result.csv', encoding='utf8') as stream:
        for line in stream:
            order_id, result, desc = line.strip().split(',')
            if result == '5' and desc == '开通成功':
                result = '1'
            elif result == '6' and desc == '开通失败':
                result = '9'
            else:
                raise RuntimeError('UNKNOWN DESC')

            l = template % mback(order_id, key, result) + '; sleep %s' % 0.5
            print(l)
            sh.write(l + '\n')

    sh.close()


if __name__ == '__main__':
    # print(template % mback('Q2015081217194201301103', 'O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM', '9'), '')
    # print(template % mback('Q2015081217194201301101', 'O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM', '9'), '')
    # print(template % mback('Q2015081217194101301100', 'O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM', '9'), '')
    # print(template % mback('Q2015081217194101301097', 'O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM', '9'), '')
    # print(template % mback('Q2015081217194101301099', 'O6NnYfTmFo5GGMcjflQJjck9iXt6QIZM', '9'), '')
    # from_file(shuffle=False, result='9', key='202b1b0dba0864352c59b0baa770e987',
    #           template='curl --data "%s" http://localhost:8900/callback/sk.do')

    # from_of_file()
    from_file('20160505.log', shuffle=False, result='9', key='1YwIdQaWqhNTb9hUsmFgyYshUcjkkcad')
