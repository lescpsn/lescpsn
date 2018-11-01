# encoding=utf-8
import mmap
from struct import unpack

operators = {1: '移动', 2: '联通', 3: '电信'}

o1 = {134, 135, 136, 137, 138, 139, 150, 151, 152, 157, 158, 159, 147, 182, 183, 184, 187, 188}
o2 = {130, 131, 132, 145, 155, 156, 185, 186, 176}
o3 = {133, 153, 177, 180, 181, 189}


class MobileClassifier:
    def __init__(self, binary_path="area_v3.bin"):
        self.f = open(binary_path, "r+b")
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
        # elif h in o3:
        #     return 3, 'CN'

        return None, None


if __name__ == "__main__":
    m = MobileClassifier('../area_v3.bin')
    num = int(15810783679 / 10000)
    o, a = m.search(num)
    print(num, o, a)
