import logging
from redis import RedisError


log = logging.getLogger('madeira.redis')


class RedisProxy(object):
    def __init__(self, main, main_prefix='A', backup=None, backup_prefix=None):
        self.main = main
        self.backup = backup

    def uid(self, key):
        try:
            uid = self.main.incr('uid', 1)
        except RedisError as e:
            if self.backup:
                uid = self.backup.incr('uid', 1)

        return uid

    def price(self, name, value):
        r = False
        try:
            nv = self.main.incr(name, -value)
            if nv < 0:
                self.main.incr(name, value)
            else:
                r = True
        except RedisError as e:
            if self.backup:
                nv = self.backup.incr(name, -value)
                if nv < 0:
                    self.backup.incr(name, value)
                else:
                    r = True

        return r

    def hset(self, name, key, value):
        try:
            self.main.hset(name, key, value)
        except RedisError as e:
            if self.backup:
                self.backup.hset(name, key, value)

    def set(self, name, value):
        try:
            self.main.set(name, value)
        except RedisError as e:
            if self.backup:
                self.backup.set(name, value)

    def rpush(self, name, *values):
        try:
            self.main.rpush(name, *values)
        except RedisError as e:
            if self.backup:
                self.backup.rpush(name, *values)

    def sadd(self, name, *values):
        try:
            self.main.sadd(name, *values)
        except RedisError as e:
            if self.backup:
                self.backup.sadd(name, *values)

    def spop(self, name):
        try:
            self.main.spop(name)
        except RedisError as e:
            if self.backup:
                self.backup.spop(name)

    def smove(self, src, dst, value):
        try:
            self.main.smove(src, dst, value)
        except RedisError as e:
            if self.backup:
                self.backup.smove(src, dst, value)

    def refund(self, name, value):
        try:
            r = self.main.incr(name, value)
            return r, 'main'
        except RedisError as e:
            if self.backup:
                r = self.backup.incr(name, value)
                return r, 'backup'

        return None, 'fail'

    def hmset(self, name, mapping):
        try:
            self.main.hmset(name, mapping)
        except RedisError as e:
            log.error(e)
            if self.backup:
                self.backup.hmset(name, mapping)

    def hgetall(self, name):
        r = None
        try:
            r = self.main.hgetall(name)
        except RedisError as e:
            log.error(e)
            if self.backup:
                r = self.backup.hgetall(name)
        return r

    def mget(self, keys):
        r = None
        try:
            r = self.main.mget(keys)
        except RedisError as e:
            log.error(e)
            if self.backup:
                r = self.backup.mget(keys)
        return r

    def get(self, name):
        r = None
        try:
            r = self.main.get(name)
        except RedisError as e:
            log.error(e)
            if self.backup:
                r = self.backup.get(name)

        return r

    def sismember(self, name, value):
        r = None
        try:
            r = self.main.sismember(name, value)
        except RedisError as e:
            log.error(e)
            if self.backup:
                r = self.backup.sismember(name, value)

        return r