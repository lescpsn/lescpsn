import datetime as dt

from redis.sentinel import Sentinel
import yaml


debug = False


def do_fix():
    config = yaml.load(open('../config.yaml', 'r'))

    sentinels = [(c['ip'], c['port']) for c in config['cache']]
    sentinel = Sentinel(sentinels, socket_timeout=0.1, db=1, decode_responses=True)

    master = sentinel.master_for('madeira')

    now = dt.datetime.now()
    d1 = dt.timedelta(1)

    try:
        order_list = master.keys('order:*')

        for key in order_list:
            ttl = master.ttl(key)
            if ttl > 0:
                continue
            order_info = master.hmget(key, ['user_id', 'req_time', 'result', 'area', 'price', 'route/1'])
            l = master.hlen(key)

            try:
                user_id = order_info[0]
                tsp = dt.datetime.fromtimestamp(float(order_info[1]))

                if now - tsp < d1:
                    continue

                # TYPE 1, result=10007
                result = order_info[2]
                if result == '10007' and l == 10:
                    print('%s %s %s len=%d' % (key, user_id, result, l))
                    master.expire(key, 600)
                    continue

                # TYPE 2, unicom pricing bug, only 101001
                if result is None and l == 9 and user_id == '101001':
                    print('%s %s (%s) %d' % (key, user_id, result, l))
                    master.expire(key, 600)
                    continue

                # TYPE 3, unicom invalid bug, only 101103
                area = order_info[3]
                price = order_info[4]
                if result is None and l == 8 and price == '10' and area in ['2:NM', '2:HI', '2:NX']:
                    print('%s %s (%s) %d %s:%s' % (key, user_id, result, l, area, price))
                    master.expire(key, 600)
                    continue

                # TYPE 4, 60002
                if result == '60002' and l == 11:
                    print('%s %s (%s) %d' % (key, user_id, result, l))
                    master.expire(key, 600)
                    continue

                routing = order_info[5]
                print(routing)

                print('%s %s (%s) %d' % (key, user_id, result, l))

            except Exception as e:
                print(e)
                print(key)

    finally:
        pass


if __name__ == "__main__":
    do_fix()