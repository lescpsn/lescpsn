import json

import time
from redis import Redis


def view_orders():
    slave = Redis(port=6380, db=1, decode_responses=True)

    orders = slave.smembers('list:error')

    for order_id in sorted(orders):
        order_info = slave.hgetall('order:%s' % order_id)
        # print('%s %s' % (order_id, json.dumps(order_info)))

        # detect error
        if 'balance' in order_info and int(order_info['balance']) > 1000000000:
            print('BALANCE OVERFLOW %s %s %s' % (order_id, order_info.get('user_id'), order_info.get('balance')))
        else:
            print('UNKNOWN          %s %s' % (order_id, json.dumps(order_info)))

    print('COUNT %d' % len(orders))


def fix_balance_overflow():
    master = Redis(db=1, decode_responses=True)

    orders = master.smembers('list:error')

    for order_id in sorted(orders):
        order_info = master.hgetall('order:%s' % order_id)
        # print('%s %s' % (order_id, json.dumps(order_info)))

        if 'balance' in order_info and int(order_info['balance']) > 1148644600:
            if order_info.get('user_id') == '700323':
                print('%s %s' % (order_id, json.dumps(order_info)))

                master.smove('list:error', 'list:finish', order_id)

                time.sleep(0.5)


view_orders()
