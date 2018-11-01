from redis.sentinel import Sentinel

'''
cache:
  name: 'db3'
  db: 5
  auth: ''
  sentinels:
    - {ip: 'localhost', port: 26379}
'''

class RedisDriver:
    def __init__(self, config):
        self.config = config
        sentinels = [(c['ip'], c['port']) for c in self.config['sentinels']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=self.config['db'], decode_responses=True)
        self.__master = None
        self.__slave = None

    @property
    def master(self):
        if False:
            if not self.__master:
                self.__master = self.sentinel.master_for(self.config['name'],password=self.config.get('auth',''))
            return self.__master
        else:
            return self.sentinel.master_for(self.config['name'],password=self.config.get('auth',''))

    @property
    def slave(self):
        if False:
            if not self.__slave:
                self.__slave = self.sentinel.slave_for(self.config['name'],password=self.config.get('auth',''))
            return self.__slave
        else:
            return self.sentinel.slave_for(self.config['name'],password=self.config.get('auth',''))