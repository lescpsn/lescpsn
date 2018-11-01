# coding=utf8
import json
import logging
import time
import tornado.gen
from tornado.httpclient import HTTPClient, HTTPRequest, AsyncHTTPClient, HTTPError

from utils.encryption_decryption import to_md5

request_log = logging.getLogger("madeira.request")

URL_PREFIX_TEST = 'http://test.dahanfc.com:3429/if/'
URL_PREFIX_STAND = 'http://if.dahanfc.com/'

URL_PREFIX = URL_PREFIX_STAND


class DahanFcInterface:
    QUERY_PRODUCT_LIST_FORMAT = '{0}?account={1}'
    QUERY_SMS_TEMPLATE_LIST_FORMAT = '{0}?account={1}&sign={2}'

    def query_product_list(self, userid):
        try:
            url = URL_PREFIX + 'FCSearchProductServlet'
            url = self.QUERY_PRODUCT_LIST_FORMAT.format(url, userid)
            http_client = HTTPClient()
            request = HTTPRequest(url=url, method='GET')
            print('QUERY PRODUCT LIST REQU: {0}'.format(url))
            response = http_client.fetch(request)
            response_info = response.body.decode()
            response_info = json.loads(response_info)
            print('QUERY PRODUCT LIST RESP: {0}'.format(response_info))

            print('>>PRODUCT LIST BEGIN<<')
            for i in response_info['information']:
                print(i['id'], i['name'])

            print('>>PRODUCT LIST END<<')
        except Exception as e:
            print('EXCEPTION', e)

    def query_sms_template_list(self, userid, md5_password):
        try:
            sign = to_md5(userid + md5_password)
            url = URL_PREFIX + 'FCMsgTemplateServlet'
            url = self.QUERY_SMS_TEMPLATE_LIST_FORMAT.format(url, userid, sign)
            http_client = HTTPClient()
            request = HTTPRequest(url=url, method='GET')
            print('QUERY SMS TEMPLATE LIST REQU: {0}'.format(url))
            response = http_client.fetch(request)
            response_info = response.body.decode()
            response_info = json.loads(response_info)
            print('QUERY SMS TEMPLATE LIST RESP: {0}'.format(response_info))

            print('>>SMS TEMPLATE LIST BEGIN<<')
            for i in response_info:
                print(i['id'], i['templateContent'])

            print('>>SMS TEMPLATE LIST END<<')
        except Exception as e:
            print('EXCEPTION', e)

    @tornado.gen.coroutine
    def send_data_order(self, url, userid, md5_password, order_id, mobile,
                        cmcc_product_id=None,
                        cucc_product_id=None,
                        ct_product_id=None):
        result = None
        try:
            tsp_now = str(int(time.time() * 1000))

            sign = to_md5(userid + md5_password + tsp_now + mobile)

            request_dict = {
                'timestamp': tsp_now,
                'account': userid,
                'mobiles': mobile,
                'sign': sign,
                'packageSize': '',
                'mobileProductId': cmcc_product_id,
                'unicomProductId': cucc_product_id,
                'telecomProductId': ct_product_id,
                # 'msgTemplateId': sms_template_id,
                'clientOrderId': order_id,
            }

            http_request = HTTPRequest(url=url, method='POST', body=json.dumps(request_dict))

            # print('SEND DATA ORDER REQU: {0}'.format(http_request.body))
            request_log.info('CALL_REQ %s', http_request.body, extra={'orderid': order_id})

            http_client = AsyncHTTPClient()
            response = yield http_client.fetch(http_request)
            response_info = response.body.decode()

            request_log.info('CALL_RESP %s', response_info, extra={'orderid': order_id})
            # print('SEND DATA ORDER RESP: {0}'.format(response_info))

            response_info = json.loads(response_info)
            result = response_info['resultCode']

        except HTTPError as http_error:
            request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': order_id})
            result = 60000 + http_error.code

        except Exception as e:
            request_log.error('{0} UPORDER EXCEPTION'.format(order_id))
            request_log.exception('{0} UPORDER EXCEPTION'.format(order_id))
            result = None

        return result


@tornado.gen.coroutine
def up_dahanfc(handler, partner):
    result = 99999
    handler.up_req_time = time.localtime()

    # 查询产品ID和短信模板ID
    product_config = handler.slave.hgetall(
        'private:dahanfc:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price))

    if not product_config:
        return result

    upstream_interface = DahanFcInterface()
    up_result = yield upstream_interface.send_data_order(
        url=partner['url.order'],
        userid=partner['userid'],
        md5_password=partner['password'],
        order_id=handler.order_id,
        mobile=handler.mobile,
        cmcc_product_id=product_config.get('cmcc_product_id'),
        cucc_product_id=product_config.get('cucc_product_id'),
        ct_product_id=product_config.get('ct_product_id')
    )

    if up_result is None:
        result = 60000
    elif up_result == '00':
        result = 0
    else:
        result = 60000 + int(up_result)

    handler.up_result = result
    handler.up_order_id = handler.order_id
    handler.up_resp_time = time.localtime()

    return result


# 查询产品和短消息模板
if __name__ == '__main__':
    test_flag = True

    if test_flag:
        userid = 'adminQuxun'
        passord = 'test5871'
    else:
        userid = 'AdminNjqx'
        passord = 'test7725'

    md5_password = to_md5(passord)
    print(md5_password)

    a = DahanFcInterface()
    a.query_sms_template_list(userid, md5_password)
    a.query_product_list(userid)
