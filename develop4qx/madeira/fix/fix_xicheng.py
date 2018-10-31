import time
import xml.etree.ElementTree as ET

import tornado
import tornado.gen

from tornado.httpclient import AsyncHTTPClient

from handlers import gen_key
from handlers import signature64

# URL = "http://218.205.123.53:26862/order/query.do"
URL = "http://218.205.123.53:26862/order/queryOrder.do"

io_loop = tornado.ioloop.IOLoop.current()
http_client = AsyncHTTPClient()

QUERY_REQ = r'''<request>
  <head>
    <custInteId>{cust_id}</custInteId>
    <echo>{echo}</echo>
    <timestamp>{tsp}</timestamp>
    <version>1</version>
    <chargeSign>{sign}</chargeSign>
  </head>
  <body>
    {content}
  </body>
</request>
'''

ITEMS_QUERY = 3


@tornado.gen.coroutine
def q(order_list):
    try:
        str_list = ''
        for order_id in order_list:
            str_list += '<item><month>201512</month><orderIds>%s</orderIds></item>' % order_id

        cust_id = 'njqxwlkj'
        secret = 'njqxwl@QX'

        echo = gen_key(8)
        tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())

        sign = signature64(cust_id + secret + echo + tsp)

        body = QUERY_REQ.format(cust_id=cust_id, echo=echo, tsp=tsp, sign=sign, content=str_list)

        print('REQUEST={%s}' % body)
        response = yield http_client.fetch(URL, method='POST', body=body)

        body = response.body.decode()
        print('RESUPONSE={%s}' % body)
        return body

    except Exception as e:
        print(e)
        return None


@tornado.gen.coroutine
def query_xicheng():
    n = 0
    try:
        order_list = []
        with open('xi.txt') as stream, open('output.txt', 'w') as output_stream:
            for line in stream:

                up_order_id = line.strip()
                if up_order_id[0] == 'Q':
                    up_order_id = up_order_id[3:]

                order_list.append(up_order_id)

                if len(order_list) >= ITEMS_QUERY:
                    resp = yield q(order_list)

                    root = ET.fromstring(resp)
                    item_list = root.findall('.//body/item')
                    for item in item_list:
                        orderId = item.find('orderId').text
                        state = item.find('state').text
                        result = item.find('result').text

                        output_stream.write('%s,%s,%s\n' % (orderId, state, result))

                    order_list = []
                    n += 1

                    # if n > 10:
                    #     return

                    yield tornado.gen.sleep(10)


    except Exception as e:
        print(e)

    finally:
        http_client.close()
        io_loop.stop()


if __name__ == '__main__':
    io_loop.add_callback(query_xicheng)
    io_loop.start()
