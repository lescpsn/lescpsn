from redis.sentinel import Sentinel

__author__ = 'Kevin'


def t():
    lines = []
    sentinel = Sentinel([('localhost', 26379)], socket_timeout=0.1, db=1, decode_responses=True)
    master = sentinel.master_for('madeira')

    route_list = master.keys('price:*:data:3:*')

    for route in route_list:
        v = master.get(route)
        a1 = route.split(':')
        face = int(a1[-1])
        v = v.split(',')
        value = v[0]

        # lines.append('redis-cli -n 1 set %s%s%s' % (route, ' ' * (50 - len(route) - len(v)), v))
        lines.append('%s%s%s %s' % (route, ' ' * (50 - len(route) - len(v)), v, value / face))
    lines = sorted(lines)

    print('\n'.join(lines))


if __name__ == '__main__':
    t()