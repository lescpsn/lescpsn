# encoding: utf8

import json
import logging.config
import tornado.gen
import yaml
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tornado.httpclient import AsyncHTTPClient

import core

io_loop = tornado.ioloop.IOLoop.current()
http_client = AsyncHTTPClient()

cfg = yaml.load(open('../logging.yaml', 'r'))
logging.config.dictConfig(cfg)


def get_session():
    engine = create_engine(
        'mysql+mysqlconnector://repo:Repo_123@192.168.137.8:3306/repo',
        pool_size=2,
        echo=False,
        echo_pool=False,
        pool_recycle=3600)

    return sessionmaker(bind=engine)()


@tornado.gen.coroutine
def test_q():
    try:
        url = 'http://localhost:8907/api/user/list_all'
        body = json.dumps({
            'domain_id': '000000',
            'size': 20,
            'page': 1,
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))
    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_template():
    try:
        url = 'http://localhost:8907/api/user/template?domain_id=000000'
        response = yield http_client.fetch(url, method='GET')

        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))
    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_add_user():
    try:
        url = 'http://localhost:8907/api/user/add'
        body = json.dumps({
            'domain_id': '000000',
            'template_id': 'data-seller',
            'name': '测试用户9',
            'login': 'test1',
            'plevel': '1',
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))
    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_product():
    try:
        url = 'http://localhost:8907/api/product/list'
        body = json.dumps({
            'domain_id': '000000',
            'page': 1,
            'size': 20,
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_special():
    try:
        url = 'http://localhost:8907/api/special/list'
        body = json.dumps({
            'domain_id': '000000',
            'user_id': '700359',
            'page': 1,
            'size': 20,
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_user_product():
    try:
        url = 'http://localhost:8907/api/special/list_product'
        body = json.dumps({
            'domain_id': '000000',
            'user_id': '100001',
            'page': 1,
            'size': 20,
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_update_special():
    try:
        url = 'http://localhost:8907/api/special/update'
        body = json.dumps({
            'domain_id': '000000',
            'user_id': '100001',
            'product_id': 'C0000005CN',
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_delete_special():
    try:
        url = 'http://localhost:8907/api/special/delete'
        body = json.dumps({
            'domain_id': '000000',
            'user_id': '100001',
            'product_id': 'C0000005CN',
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_sync_user():
    try:
        yield core.sync_user(get_session(), '000000')
    finally:
        io_loop.stop()


@tornado.gen.coroutine
def test_sync_pricing(filter_user, filter_product):
    try:
        yield core.sync_pricing(get_session(), '000000', filter_user=filter_user, filter_product=filter_product)
    finally:
        io_loop.stop()


REQUEST = "UserName={username}&UserPass={userpass}&Subid={subid}&Mobile={mobile}&Content={content}"


@tornado.gen.coroutine
def sms():
    try:

        body = REQUEST.format(
            username='quxun',
            userpass='123456',
            subid='',
            mobile='13951771065',
            content='【流量充】您充值的11G通用流量已经提交成功，具体到账时间以运营商通知为准，有效期截至2015年7月31日'
        )

        yield http_client.fetch('http://114.215.130.61:8082/SendMT/SendMessage', method="POST", body=body)
    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_interface():
    try:
        url = 'http://localhost:8907/api/route/interface/list?domain_id=000000'

        response = yield http_client.fetch(url, method='GET')
        body = response.body.decode()
        x = json.loads(body)
        print(json.dumps(x, indent=2))

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_interface_price():
    try:
        url = 'http://localhost:8907/api/route/interface/price?domain_id=000000&interface_id=cmcc-ha'

        response = yield http_client.fetch(url, method='GET')
        body = response.body.decode()
        # x = json.loads(body)
        print(body)

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_supply_list():
    try:
        url = 'http://localhost:8907/api/route/supply/list?domain_id=000000'

        response = yield http_client.fetch(url, method='GET')
        body = response.body.decode()
        # x = json.loads(body)
        print(body)

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_supply_add():
    body = json.dumps({
        'domain_id': '000000',
        'name': '全局',
        'interfaces': {
        }
    })

    try:
        url = 'http://localhost:8907/api/route/supply/add'

        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        # x = json.loads(body)
        print(body)

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_supply_update():
    body = json.dumps({
        'domain_id': '000000',
        'interface_id': 1,
        'name': '全局',
        'interfaces': {
        }
    })

    try:
        url = 'http://localhost:8907/api/route/supply/update'

        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        # x = json.loads(body)
        print(body)

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_product_supply():
    try:
        url = 'http://localhost:8907/api/route/product/list?domain_id=000000'

        response = yield http_client.fetch(url, method='GET')
        body = response.body.decode()
        # x = json.loads(body)
        print(body)

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_user_supply():
    try:
        url = 'http://localhost:8907/api/route/user/list?domain_id=000000'

        response = yield http_client.fetch(url, method='GET')
        body = response.body.decode()
        # x = json.loads(body)
        print(body)

    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def debug_ioloop():
    try:
        url = 'http://baidu.com'

        response = yield http_client.fetch(url, method='GET')
        body = response.body.decode()
        # x = json.loads(body)
        print(body)
    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_add_domain():
    try:
        url = 'http://localhost:8907/api/domain/add'
        body = json.dumps({
            'domain_id': '000000',
            'domain_name': 'domain_name_test',
            'title': 'title_test',
            'hosts': 'hosts_test',
            'up_domain': 'up_domain_test',
            'up_user': 'up_user_test',
            'status': 'status_1',
        })
        response = yield http_client.fetch(url, method='POST', body=body)
        body = response.body.decode()
        x = body
        print(json.dumps(x, indent=2))
    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_list_all_domain():
    try:
        url = 'http://localhost:8907/api/domain/list_all'
        response = yield http_client.fetch(url, allow_nonstandard_methods=True, method='POST')
        if response and response.code == 200:
            body = response.body.decode()
            print(body)
    finally:
        http_client.close()
        io_loop.stop()


@tornado.gen.coroutine
def test_get_user_by_id(user_id):
    try:
        body = json.dumps({'user_id': user_id})

        url = 'http://localhost:8907/api/user/by_id'
        response = yield http_client.fetch(url, method='POST', body=body)

        if response and response.code == 200:
            body = response.body.decode()
            print(body)
    finally:
        http_client.close()
        io_loop.stop()


if __name__ == '__main__':
    # io_loop.add_callback(test_list_special)
    io_loop.add_callback(test_get_user_by_id, '100001')
    # io_loop.add_callback(test_sync_pricing, '100001', 'M0000010CN')
    # io_loop.add_callback(test_sync_pricing, None, None)
    # io_loop.add_callback(test_sync_pricing, None, None)
    # io_loop.add_callback(test_sync_user)
    # io_loop.add_callback(debug_ioloop)
    # io_loop.add_callback(test_add_domain)
    # io_loop.add_callback(test_list_all_domain)

    io_loop.start()
