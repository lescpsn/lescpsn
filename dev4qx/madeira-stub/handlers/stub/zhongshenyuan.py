import json
import logging
import time
import tornado
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from urllib.parse import urlencode
from tornado.ioloop import IOLoop


request_log = logging.getLogger("madeira.request")


class ZhongshenyuanOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        try:

            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]
            print(order_id)
            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="0000" r2="0000;成功"


            if r1 == '100':
                data = {"code": r1, "tip": "执行成功",}
            else:
                data = {"code": r1, "tip": "失败"}

            self.finish(json.dumps(data))

            if r1 == '100':
                IOLoop.current().call_later(5, zhongshenyuan_callback, order_id, r2)

        except Exception:
            request_log.exception('FAIL')


def zhongshenyuan_callback(order_id, result):

    if ';' in result:
        result = result.split(';')[0]

    body = {
        "orderNo": order_id,
        "resCode": result,
        "redMsg": '成功',

    }

    body = urlencode(body)
    url = 'http://localhost:8899/callback/zhongshenyuan' + '?' + body
    print(body)
    print(url)

    http_client = AsyncHTTPClient()

    try:
        request_log.info('YFLOW CALLBACK\n%s', body)

        http_client.fetch(url, method='POST', body=body)
    except Exception:
        request_log.exception('FAIL')
    finally:
        http_client.close()
