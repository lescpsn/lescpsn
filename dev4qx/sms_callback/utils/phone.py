# coding=utf-8
import mmap
import os
from struct import unpack
from struct import pack


operators = {1: '移动', 2: '联通', 3: '电信'}

o1 = {134, 135, 136, 137, 138, 139, 150, 151, 152, 157, 158, 159, 147, 182, 183, 184, 187, 188}
o2 = {130, 131, 132, 145, 155, 156, 185, 186, 176}
o3 = {133, 153, 177, 180, 181, 189}

# 中华人民共和国行政区划代码（GB/T 2260—1999）
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


class OldClassifier():
    def __init__(self):
        self.f = open("phone.dat", "r+b")
        self.mm = mmap.mmap(self.f.fileno(), 0)
        self.firstRecordOffset, = unpack('I', self.mm[4:8])
        self.size = self.mm.size()
        self.recordNum = int((self.size - self.firstRecordOffset) / 9)

        print(self.firstRecordOffset)
        print(self.recordNum)

    def export(self):
        with open('area.bin', 'wb') as f:
            l = 0
            while l < self.recordNum:
                c = int(self.firstRecordOffset + l * 9)
                data = self.mm[c:c + 9]
                phone_no, offset, operator = unpack('iiB', data)

                p = self.mm.find(b'|', offset + 8)
                line = self.mm[offset + 8:p].decode('utf8')
                area = areaMap.get(line)
                if area is None:
                    print(line)
                    break

                f.write(pack('ib', phone_no, operator))
                f.write(area.encode('ascii'))

                l += 1

    def parse(self, mobile):

        l = 0
        r = self.recordNum - 1

        while l <= r:
            m = int((l + r) / 2)
            c = int(self.firstRecordOffset + m * 9)

            data = self.mm[c:c + 9]
            phone_no, offset, operator = unpack('iiB', data)

            if phone_no > mobile:
                r = m - 1
            elif phone_no < mobile:
                l = m + 1
            else:
                p = self.mm.find(b'\0', offset + 8)
                line = self.mm[offset + 8:p]

                return line.decode('utf8'), operator


class MobileClassifier():
    def __init__(self):
        self.f = open("area_v3.bin", "r+b")
        self.mm = mmap.mmap(self.f.fileno(), 0)
        self.package = 7
        self.recordNum = int(self.mm.size() / self.package)
        print('loading area %d' % self.recordNum)

    def search(self, mobile):
        if type(mobile) is str:
            mobile = int(mobile[:7])

        l = 0
        r = self.recordNum - 1

        while l <= r:
            m = int((l + r) / 2)
            c = m * self.package

            phone_no, = unpack('i', self.mm[c:c + 4])

            if phone_no > mobile:
                r = m - 1
            elif phone_no < mobile:
                l = m + 1
            else:
                b = int(unpack('b', self.mm[c + 4:c + 5])[0])
                op = self.mm[c + 5:c + 7].decode('ascii')

                return b, op

        # fallback
        h = int(mobile / 10000)
        if h in o1:
            return 1, 'CN'
        elif h in o2:
            return 2, 'CN'
        elif h in o3:
            return 3, 'CN'

        return None, None


if __name__ == "__main__":
    m = MobileClassifier()
    # for x in range(1000):
    num = int(13078080079 / 10000)
    o, a = m.search(num)
    print(num, o, a)