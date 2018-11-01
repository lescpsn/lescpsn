# coding=utf8
areaMap = {'北京': 'BJ',
           '天津': 'TJ',
           '河北': 'HE',
           '山西': 'SX',
           '内蒙古': 'NM',
           '辽宁': 'LN',
           '吉林': 'JL',
           '黑龙江': 'HL',
           '上海': 'SH',
           '江苏': 'JS',
           '浙江': 'ZJ',
           '安徽': 'AH',
           '福建': 'FJ',
           '江西': 'JX',
           '山东': 'SD',
           '河南': 'HA',
           '湖北': 'HB',
           '湖南': 'HN',
           '广东': 'GD',
           '广西': 'GX',
           '海南': 'HI',
           '重庆': 'CQ',
           '四川': 'SC',
           '贵州': 'GZ',
           '云南': 'YN',
           '西藏': 'XZ',
           '陕西': 'SN',
           '甘肃': 'GS',
           '青海': 'QH',
           '宁夏': 'NX',
           '新疆': 'XJ',
           '台湾': 'TW',
           '香港': 'HK',
           '全国': 'CN'}

upMap = {'好充': 'haochong',
         '速卡空充': 'suka-air',
         '速卡全国': 'suka-nation',
         'machado': 'machado',
         'shili': 'shili'}

carrierMap = {
    'cmcc': '1',
    'cucc': '2',
    'ctcc': '3',
}


def get_value(f):
    a = f.split('.')
    v = int(a[0]) * 10000

    if len(a) > 1:
        b = a[1].strip() + '0000'
    else:
        b = '0000'

    v += int(b[0:4])

    return v


def up(user_id, carrier_name):
    carrier = carrierMap.get(carrier_name)

    output = open('fee/{user_id}_{carrier_name}_up.sh'.format(user_id=user_id, carrier_name=carrier_name), 'wb')

    f = open('{carrier_name}_upstream.csv'.format(carrier_name=carrier_name), 'r', encoding='utf8')

    i = 0
    for line in f:
        i += 1
        plist = line.strip().split(',')

        if len(plist) != 10:
            print('Error', plist)
            break
        if i == 1:
            continue  # skip first line

        area = areaMap.get(plist[0])
        up = upMap.get(plist[9])

        for j in range(1, 9):
            face = [10, 20, 30, 50, 100, 200, 300, 500][j - 1]
            # print(j)
            if len(plist[j]) == 0:
                output.write(('redis-cli -n 1 del "route:{user_id}:fee:{carrier}:{area}:{face}"\n'.format(
                    user_id=user_id,
                    carrier=carrier,
                    area=area,
                    face=face)).encode('utf8'))
            else:
                value = get_value(plist[j])

                discount = int(value / face)
                if discount < 9600:
                    print('ALERT %d' % discount)

                routing = "{up},{value}".format(up=up, value=value)
                output.write(
                    ('redis-cli -n 1 set "route:{user_id}:fee:{carrier}:{area}:{face}" "{routing}"\n'.format(
                        user_id=user_id,
                        carrier=carrier,
                        area=area,
                        face=face,
                        routing=routing,
                    )).encode('utf8'))

                print(("insert into "
                       "purus.routing (user_id, carrier, area, price, routing, status) "
                       "values "
                       "('{user_id}', '{carrier}', '{area}', '{price}', '{routing}', '{status}');").format(
                    user_id=user_id, carrier=carrier, area=area, price=face, routing=routing, status='valid'))

                output.close()


def down(user_id, carrier_name):
    carrier = carrierMap.get(carrier_name)

    output = open('fee/{user_id}_{carrier_name}_down.sh'.format(user_id=user_id, carrier_name=carrier_name), 'wb')

    f = open('{carrier_name}_downstream.csv'.format(carrier_name=carrier_name), 'r', encoding='utf8')

    i = 0
    for line in f:
        i += 1
        plist = line.strip().split(',')

        if len(plist) != 9:
            print('Error')
            break
        if i == 1:
            continue  # skip first line

        area = areaMap.get(plist[0])
        for j in range(1, 9):
            face = [10, 20, 30, 50, 100, 200, 300, 500][j - 1]

            if plist[j] == '':
                output.write(('redis-cli -n 1 del "price:{user_id}:fee:{carrier}:{area}:{face}"\n'.format(
                    user_id=user_id,
                    carrier=carrier,
                    area=area,
                    face=face)).encode('utf8'))
            else:
                value = get_value(plist[j])

                discount = int(value / face)
                if discount < 9600:
                    print('ALERT %d' % discount)

                output.write(('redis-cli -n 1 set "price:{user_id}:fee:{carrier}:{area}:{face}" "{value}"\n'.format(
                    user_id=user_id,
                    carrier=carrier,
                    area=area,
                    face=face,
                    value=value)).encode('utf8'))


if __name__ == "__main__":
    up('200805', 'cmcc')
    down('200805', 'cmcc')
    # up('200801', 'cucc')
    # down('200801', 'cucc')
