import logging
import time
import xml.etree.ElementTree as et

import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

from handlers import signature

h = {'Content-Type': 'application/x-www-form-urlencoded'}

request_log = logging.getLogger("madeira.request")


@tornado.gen.coroutine
def up_standard(handler, partner):
    """速卡科技
        userid	string	1-20	商代理商编号
        productid	string	1-20	平台对应商品编号(可以为空，为空时，以手机号实际所在地自动对应商品编号,并且不做充值金额判断)
        price	string	1-20	充值金额（面值）整数，如：50,100
        num	int	1-10	订单商品数量（只能为1）
        mobile	string	1-11	充值手机号
        spordertime	time	1-14	代理商订单时间YYYY-MM-DD HH:MI:SS
        sporderid	string	1-30	代理商系统订单号（流水号）要求不可重复，每笔只可同时提交一次
        md5({oid}{cid}{pr}{nb}{fm}{pn}{ru}{tsp}{key})
    """
    handler.up_req_time = time.localtime()
    tsp = time.strftime("%Y%m%d%H%M%S", handler.up_req_time)

    price = handler.price

    # get product_id for data product
    if handler.product == 'data':
        prefix = partner.get('prefix', 'suka')
        k1 = 'private:{prefix}:{carrier}:{area}:{price}'.format(
            prefix=prefix, carrier=handler.carrier, area=handler.area, price=handler.price)
        k2 = 'private:{prefix}:{carrier}:{price}'.format(
            prefix=prefix, carrier=handler.carrier, price=handler.price)

        p1, p2 = handler.slave.mget(k1, k2)
        product_id = p1 or p2

        if product_id is None:
            handler.up_result = 5003
            return handler.up_result

        if ',' in product_id:
            product_id, price = product_id.split(',')

        if prefix == 'suka' and handler.carrier == 2 and price == 10:
            price = 5

    else:
        product_id = ''


    if handler.product in ['fee','data']:
        # package
        qt = 'userid=%s&productid=%s&price=%s&num=1&mobile=%s&spordertime=%s&sporderid=%s' % (
            partner['userid'],
            product_id,
            price,
            handler.mobile,
            tsp,
            handler.order_id
        )
    else:
        # package
        qt = 'product=%s&userid=%s&productid=%s&price=%s&num=1&account_number=%s&spordertime=%s&sporderid=%s' % (
            handler.product,
            partner['userid'],
            product_id,
            price,
            handler.mobile,
            tsp,
            handler.order_id
        )

    # sign
    sign = signature(qt + '&key=' + partner['key'])

    url = partner['url.order']
    # urllib.parse.quote(
    body = '%s&sign=%s&back_url=%s' % (qt, sign, partner['callback'])

    # upuserid
    if 'send_user' in partner:
        body = body + '&upuserid=' + handler.user_id

    # print(handler.order_id + ":" + body)
    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    result = 9999
    http_client = AsyncHTTPClient()

    try:
        response = yield http_client.fetch(url, method='POST', headers=h, body=body,
                                           connect_timeout=30, request_timeout=30)

    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
        response = None

    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})
        response = None

    finally:
        http_client.close()

    handler.up_resp_time = time.localtime()  # <--------------

    if response and response.code == 200:
        body = response.body.decode('gbk')
        request_log.info('CALL_RESP %s', body, extra={'orderid': handler.order_id})

        try:
            root = et.fromstring(body)
            result = int(root.find('resultno').text)
            handler.up_order_id = root.find('orderid').text
            handler.up_cost = root.find('ordercash').text or 0
            handler.up_result = result
        except Exception as e:
            result = 9999
            request_log.error('PARSE UPSTREAM %s', e, extra={'orderid': handler.order_id})

    return result
