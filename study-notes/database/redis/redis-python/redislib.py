#!/usr/bin/env python3
#-*- coding: utf-8 -*-

import redis



# hmset pool:trafficweb100 route trafficweb carrier 1 name 全国移动100M
# hmset pool:trafficweb300 route trafficweb carrier 2 name 全国联通300M
# hmset pool:xiaowo100 route xiaowo carrier 3 name 电信(全国)100M

class RedisLib:
    def __init__(self):
        self.host = '127.0.0.1'
        self.port = 6379
        self.db = 1
        self.r = redis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=True)

    def get_keys(self, key):
        return (self.r.keys(key))

    def del_key(self, key):
        return (self.r.delete(key))

    #字符串类型的操作
    def set_set(self, key, value):
        return (self.r.set(key, value))


    #hashes类型的操作
    def get_hvals(self, key):
        return (self.r.hvals(key))

    def get_hgetall(self, key):
        return (self.r.hgetall(key))


    def set_hmset(self, key, value):
        return (self.r.hmset(key, value))

if __name__ == "__main__":
    r = RedisLib()

    aaa = r.get_keys("pool:*")
    print(aaa)
    print(type(aaa))

    for l in aaa:
        ret = r.get_hgetall(l)
        print(ret)
        print(type(ret))

    bbb = r.get_hgetall("pool:xiaowo100")
    print(bbb)
    print(type(bbb))

    ccc = r.get_hvals("pool:xiaowo100")
    print(ccc)
    print(type(ccc))

    ddd = r.del_key("pool:xiaowo100")
    print(ddd)
    print(type(ddd))

    r.set_hmset("pool:xiaowo100", {"route":"xiaowo", "carrier":3, "name":"电信(全国)100M"})
