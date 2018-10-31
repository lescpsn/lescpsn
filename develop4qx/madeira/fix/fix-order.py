from datetime import datetime
import sys

from redis.sentinel import Sentinel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import yaml

from db.shard import get_up_order_shard, get_order_shard


def get_s(obj, binary):
    if binary not in obj:
        return None
    return obj[binary]


def get_i(obj, binary):
    if binary not in obj:
        return None
    try:
        return int(obj[binary])
    except:
        return None


def get_t(obj, binary):
    if binary not in obj:
        return None
    try:
        t = float(obj[binary])
        return datetime.fromtimestamp(t)
    except:
        return None


class FixTask():
    def __init__(self, _config, dry_run):

        sentinels = [(c['ip'], c['port']) for c in _config['cache']]
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1, db=1, decode_responses=True)
        self.dry_run = dry_run

        engine = create_engine(
            _config['database']['url'],
            pool_size=2, echo=not dry_run, pool_recycle=3600)

        self.session = sessionmaker(bind=engine)

    def persist_single(self, order_id, session, master):

        try:
            key = 'order:%s' % order_id
            order_info = master.hgetall(key)

            # key_id = get_i(order_info, 'id')

            user_id = get_s(order_info, 'user_id')
            master_id = get_s(order_info, 'master_id')
            if master_id is None:
                master_id = user_id

            price = get_i(order_info, 'price')
            value = get_i(order_info, 'value')
            sp_order_id = get_s(order_info, 'sp_order_id')
            result = get_s(order_info, 'result')
            order_cls = get_order_shard(master_id)
            order = session.query(order_cls).filter(order_cls.order_id == order_id).first()

            print('FIX ORDER %s; need_fix=%s / %s' % (order_id, order is None, user_id))

            if result == '10007' and value is None:
                print('JUST SKIP THE ORDER')
            elif order is None:
                """
                1) mobile 长度超长
                2) result 为null （异常退出）
                3) 表不存在
                """
                order = order_cls()
                order.order_id = order_id
                order.user_id = user_id
                order.price = price
                order.mobile = get_s(order_info, 'mobile')
                order.sp_order_id = sp_order_id
                order.req_time = get_t(order_info, 'req_time')
                order.resp_time = get_t(order_info, 'resp_time')
                order.back_time = get_t(order_info, 'back_time')
                order.result = result
                order.back_result = get_s(order_info, 'back_result')
                order.value = value
                order.balance = get_i(order_info, 'balance')
                order.area = get_s(order_info, 'area')
                order.product = get_s(order_info, 'product')

                if len(order.mobile) > 11:
                    print("\tFIX1: MOBILE INVALID")
                    order.mobile = order.mobile[0:11]
                elif order.result is None:
                    print("\tFIX2: RESULT IS NULL")
                    order.result = '5003'
                else:
                    print("\tFIX?: UNKNOWN")

                if not self.dry_run:
                    session.add(order)
                    session.commit()

            # --------------UP--------------------
            stage = get_i(order_info, 'stage')

            if stage:
                for i in range(1, stage + 1):
                    up_req_time = get_t(order_info, 'up_req_time/%d' % i)

                    if up_req_time:
                        # check
                        up_order_cls = get_up_order_shard(master_id)

                        up_order = session.query(up_order_cls).filter(up_order_cls.order_id == order_id).filter(
                            up_order_cls.stage == stage).first()

                        print('\tFIX UP_ORDER %s(%d) need_fix=%s' % (order_id, i, up_order is None))

                        if up_order is None:
                            up_order = up_order_cls()
                            up_order.stage = i
                            up_order.order_id = order_id
                            up_order.up_order_id = get_s(order_info, 'up_order_id/%d' % i)
                            up_order.route = get_s(order_info, 'route/%d' % i)
                            up_order.price = price
                            up_order.cost = get_i(order_info, 'cost/%d' % i)
                            up_order.up_cost = get_s(order_info, 'up_cost/%d' % i)
                            up_order.up_req_time = up_req_time
                            up_order.up_resp_time = get_t(order_info, 'up_resp_time/%d' % i)
                            up_order.up_back_time = get_t(order_info, 'up_back_time/%d' % i)
                            up_order.up_result = get_s(order_info, 'up_result/%d' % i)
                            up_order.up_back_result = get_s(order_info, 'up_back_result/%d' % i)

                            if not self.dry_run:
                                session.add(up_order)
                                session.commit()

            print("EXPIRE %s" % key)
            if not self.dry_run:
                master.expire(key, 1800)
                master.expire(('map:%s' % sp_order_id), 1800)
            return 0

        except Exception as e:
            print('PROCESS %s FAIL: %s' % (order_id, e))
            return -1

    def do_fix(self):
        print('TASK ORDER START')
        master = self.sentinel.master_for('madeira')

        if not master.exists('list:error'):
            return

        session = self.session()
        try:
            # save finished order & up_order
            order_list = master.smembers('list:error')

            order_list = sorted(order_list)

            for order_id in order_list[:5]:
                r = self.persist_single(order_id, session, master)

                if r == 0:
                    print('SREM %s', order_id)
                    if not self.dry_run:
                        master.srem('list:error', order_id)
                        master.srem('list:save', order_id)

        except Exception as e:
            print('TASK ORDER FAIL %s' % e)
        finally:
            session.rollback()
            session.close()
            print('TASK ORDER FINISH')


if __name__ == "__main__":
    dry_run = True

    print(sys.argv)

    if len(sys.argv) > 1 and sys.argv[1] == '-r':
        dry_run = False

    print('DRY RUN: %s' % dry_run)

    config = yaml.load(open('config.yaml', 'r'))

    task = FixTask(config, dry_run)
    task.do_fix()
