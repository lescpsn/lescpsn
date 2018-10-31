import json
import logging
import time
import tornado
import tornado.gen
import tornado.web
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from urllib.parse import urlencode

request_log = logging.getLogger("madeira.request")


class SuopaiOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        try:

            master_target = self.application.sentinel.master_for('madeira', db=1)
            master_test = self.application.sentinel.master_for('madeira', db=3)

            all_orders = master_target.smembers('list:create')
            order_id = sorted(all_orders, reverse=True)[0]
            r2 = r1 = master_test.hget('result:' + order_id, 'result')  # 根据redis判断订单状态 r2=r1='100,00;成功'
            if ',' in r1:
                r1, r2 = r1.split(',')  # r1="0000" r2="0000;成功"
            order_id = 'SPO_20160330161832540'
            if r1 == 'true':
                data = {"success": r1, "message": "成功", "jobId": order_id, "mobile": '15062203369'}
            else:
                data = {"success": r1, "error": "错误"}

            # yield tornado.gen.sleep(180)

            self.finish(json.dumps(data))
            if r1 == 'true':
                IOLoop.current().call_later(10, suopai_callback, order_id, r2)
        except Exception:
            request_log.exception('FAIL')


def suopai_callback(order_id, result):
    tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())

    if ';' in result:
        result = result.split(';')[0]

    body = {
        "status": result,
        "remark": "\u5145\u503c\u6210\u529f",
        "jobId": order_id,
        "statusTime": tsp
    }

    body = urlencode(body)
    url = 'http://localhost:8899/callback/suopai' + '?' + body
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


class SuopaiQueryHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        try:
            orderId = self.get_argument("orderId")
            data = {"success": 'true', "mobile": '15062203369', "jobId": 'SPO_20160330161832540'}
            self.finish(json.dumps(data))
        except Exception:
            request_log.exception('FAIL')


class SuopaiQueryOrderHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        try:
            jobId = self.get_argument("jobId")
            data = {"success": 'true', "jobId": jobId, "mobile": '15062203369', "status": '1', "remark": ''}
            # data = {"success": false,"error": 'false'}
            self.finish(json.dumps(data))
        except Exception:
            request_log.exception('FAIL')
