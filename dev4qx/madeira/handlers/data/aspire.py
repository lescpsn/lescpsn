import hashlib
import logging
import time
import xml.etree.ElementTree as ET
import base64
import yaml
from Crypto.Cipher import AES

import urllib.request
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPError

request_log = logging.getLogger("madeira.request")


class AspireBase:
    ORDER_TYPE = "00"  # 00-普通预付费订单（除接入时特别指定，其他情况都填写00）01-2B非预付费直营模式  02-2C网盟订单
    OPEN_TYPE = "1"  # 1-直充；2-卡密下发

    BS = 16

    def pad_bytes(self, s):
        return s + bytes([(self.BS - len(s) % self.BS)]) * (self.BS - len(s) % self.BS)

    def aes_encrypt(self, key, value):
        cipher = AES.AESCipher(key, AES.MODE_ECB)
        cipher_text = cipher.encrypt(self.pad_bytes(value))
        sign_result = ''.join(["%02X" % x for x in cipher_text])

        return sign_result

    def process_key_list(self, key_list):
        return ''.join(key_list.split())

    # 进行数字签名
    def sign_aspire_arguments(self, key, request_key_list, **url_arguments):
        url_arguments = request_key_list.format(**url_arguments)
        url_arguments = url_arguments.encode('gbk')

        m = hashlib.md5()
        m.update(url_arguments)
        md5_data = m.digest()

        return self.aes_encrypt(key, md5_data)

    # 拆分趣讯订单号, 时间必须在30分钟内，不然会返回invalid transaction id
    def get_transaction_id(self, channel_id, quxun_order_id=None):
        if quxun_order_id:
            return channel_id + self.ORDER_TYPE + quxun_order_id[1:15] + quxun_order_id[-5:]
        else:
            time_now = time.localtime()
            tsp = time.strftime("%Y%m%d%H%M%S", time_now)
            return channel_id + self.ORDER_TYPE + tsp + "00000"


# 3.1.渠道订单直充开通接口
class AsipreOpenCard(AspireBase):
    REQUEST = ('<?xml version="1.0" encoding="GBK"?>'
               '<OpenCardReq>'
               '<TransactionId>{TransactionId}</TransactionId>'
               '<ChannelId>{ChannelId}</ChannelId>'
               '<ChannelOrderId>{ChannelOrderId}</ChannelOrderId>'
               '<PhoneNum>{PhoneNum}</PhoneNum>'
               '<CardCode>{CardCode}</CardCode>'
               '<OpenType>{OpenType}</OpenType>'
               '<CardValue>{CardValue}</CardValue>'
               '<SaleDiscount>{SaleDiscount}</SaleDiscount>'
               '<RealFee>{RealFee}</RealFee>'
               '<OrderTime>{OrderTime}</OrderTime>'
               '<Sign>{Sign}</Sign>'
               '</OpenCardReq>')

    REQUEST_KEY_LIST = ('CardCode={CardCode}'
                        '&CardValue={CardValue}'
                        '&ChannelId={ChannelId}'
                        '&ChannelOrderId={ChannelOrderId}'
                        '&OpenType={OpenType}'
                        '&OrderTime={OrderTime}'
                        '&PhoneNum={PhoneNum}'
                        '&RealFee={RealFee}'
                        '&SaleDiscount={SaleDiscount}'
                        '&TransactionId={TransactionId}')

    RESPONSE = ('<?xml version="1.0" encoding="GBK"?>'
                '<OpenCardRsp>'
                '<TransactionId>(交易流水号)</TransactionId>'
                '<RspCode>(交易结果响应码)</RspCode>'
                '<ResultMsg>(应答说明)</ResultMsg>'
                '<IMPPOrderId>(IMPP平台唯一订单号)</IMPPOrderId>'
                '</OpenCardRsp>')

    def produce_request_body(self, handler, partner):
        card_info = handler.slave.hgetall(
            'private:aspire:{carrier}:{price}'.format(carrier=handler.carrier, price=handler.price))
        card_code = card_info.get('card_code')
        real_fee = handler.price

        transaction_id = self.get_transaction_id(partner['channel_id'], handler.order_id)

        order_time = "{0}-{1}-{2} {3}:{4}:{5}".format(transaction_id[9:13], transaction_id[13:15],
                                                      transaction_id[15:17],
                                                      transaction_id[17:19], transaction_id[19:21],
                                                      transaction_id[21:23])

        key = base64.b64decode(partner['aeskey'])

        arguments_list = {
            'TransactionId': transaction_id,
            'ChannelId': partner['channel_id'],  # 渠道代码
            'ChannelOrderId': handler.order_id[-8:],  # 渠道交易订单号
            'PhoneNum': self.aes_encrypt(key, handler.mobile.encode('gbk')),  # 用户手机号
            'CardCode': card_code,  # 卡品
            'OpenType': self.OPEN_TYPE,  # 开通类型
            'CardValue': handler.price,  # 卡面值
            'SaleDiscount': (real_fee / handler.price),  # 销售折扣
            'RealFee': real_fee,  # 实际销售费用
            'OrderTime': order_time,  # 订购时间
        }

        sign = self.sign_aspire_arguments(key, self.REQUEST_KEY_LIST, **arguments_list)

        body = self.REQUEST.format(Sign=sign, **arguments_list)

        return transaction_id, body

    def parse_response(self, response):
        transaction_id = None
        rsp_code = None
        result_msg = None
        impp_order_id = None

        try:
            root = ET.fromstring(response)

            temp = root.findall('TransactionId')
            if temp and temp[0].text:
                transaction_id = temp[0].text

            temp = root.findall('RspCode')
            if temp and temp[0].text:
                rsp_code = temp[0].text

            temp = root.findall('ResultMSG')
            if temp and temp[0].text:
                result_msg = temp[0].text

            temp = root.findall('IMPPOrderId')
            if temp and temp[0].text:
                impp_order_id = temp[0].text

        except Exception as e:
            print("AsipreOpenCard exception:", e)

        return {'transaction_id': transaction_id,
                'rsp_code': rsp_code,
                'result_msg': result_msg,
                'impp_order_id': impp_order_id}


# 4.1.接口一电子渠道卡品请求接口
class AspireQuerySaleCard(AspireBase):
    REQUEST = ('<?xml version="1.0" encoding="GBK"?>'
               '<QuerySaleCardReq>'
               '<TransactionId>{TransactionId}</TransactionId>'
               '<ChannelId>{ChannelId}</ChannelId>'
               '<Sign>{Sign}</Sign>'
               '</QuerySaleCardReq>')

    REQUEST_KEY_LIST = 'ChannelId={ChannelId}&TransactionId={TransactionId}'

    def produce_request_body(self, channel_id, aes_key):
        transaction_id = self.get_transaction_id(channel_id)

        arguments_list = {
            'TransactionId': transaction_id,
            'ChannelId': channel_id
        }

        sign = self.sign_aspire_arguments(aes_key, self.REQUEST_KEY_LIST, **arguments_list)

        body = self.REQUEST.format(Sign=sign, **arguments_list)

        try:
            root = ET.fromstring(body)
        except Exception as e:
            print("AspireQuerySaleCard exception:", e)

        return body

    def parse_response(self, response):
        transaction_id = None
        rsp_code = None
        result_msg = None
        card_info_list = []

        try:
            root = ET.fromstring(response)
            temp = root.findall('TransactionId')
            if temp and temp[0].text:
                transaction_id = temp[0].text

            temp = root.findall('ResultCode')
            if temp and temp[0].text:
                rsp_code = temp[0].text

            temp = root.findall('ResultMsg')
            if temp and temp[0].text:
                result_msg = temp[0].text

            l = root.findall('.//CardInfoList/CardInfo')
            for card in l:
                saled_province_code = card.find('SaledProvinceCode').text
                card_code = card.find('CardCode').text
                card_name = card.find('CardName').text
                flow_number = card.find('FlowNumber').text
                card_value = card.find('CardValue').text
                max_discount = card.find('MaxDiscount').text
                min_discount = card.find('MinDiscount').text
                card_info_list.append({
                    'saled_province_code': saled_province_code,
                    'card_code': card_code,
                    'card_name': card_name,
                    'flow_number': flow_number,
                    'card_value': card_value,
                    'max_discount': max_discount,
                    'min_discount': min_discount,
                })

        except Exception as e:
            print("AspireQuerySaleCard exception:", e)

        return {'transaction_id': transaction_id,
                'rsp_code': rsp_code,
                'result_msg': result_msg,
                'card_info_list': card_info_list}


# 4.2.订单状态查询接口
class AspireQueryOrderStatus(AspireBase):
    REQUEST = ('<?xml version="1.0" encoding="GBK"?>'
               '<QueryOrderStatusReq>'
               '<TransactionId>{TransactionId}</TransactionId>'
               '<ChannelId>{ChannelId}</ChannelId>'
               '<OrderNum>{OrderNum}</OrderNum>'
               '<Sign>{Sign}</Sign>'
               '<OrderTransList>'
               '<CardOpenTranId>{CardOpenTranId}</CardOpenTranId>'
               '</OrderTransList>'
               '</QueryOrderStatusReq>')

    REQUEST_KEY_LIST = 'ChannelId={ChannelId}&OrderNum={OrderNum}&TransactionId={TransactionId}'

    def produce_request_body(self, partner, card_open_tran_id):
        channel_id = partner['channel_id']
        transaction_id = self.get_transaction_id(channel_id)
        card_open_tran_id = card_open_tran_id

        arguments_list = {
            'TransactionId': transaction_id,
            'ChannelId': channel_id,
            'OrderNum': 1,
        }

        key = base64.b64decode(partner['aeskey'])
        sign = self.sign_aspire_arguments(key, self.REQUEST_KEY_LIST, **arguments_list)
        body = self.REQUEST.format(Sign=sign, CardOpenTranId=card_open_tran_id, **arguments_list)

        return body

    def parse_response(self, response):
        transaction_id = None
        rsp_code = None
        result_msg = None

        card_open_tran_id = None
        channel_order_id = None
        impp_order_id = None
        channel_id = None
        province = None
        card_name = None
        order_time = None
        order_status = None
        order_status_desc = None
        order_finish_time = None
        try:
            root = ET.fromstring(response)
            transaction_id = root.find('TransactionId')
            rsp_code = root.find('ResultCode')
            result_msg = root.find('ResultMsg')

            l = root.findall('.//OrderStatusList/OrderStatusInfo')
            for order in l:
                card_open_tran_id = order.find('CardOpenTranId').text
                channel_order_id = order.find('ChannelOrderId').text
                impp_order_id = order.find('IMPPOrderId').text
                channel_id = order.find('ChannelId').text
                province = order.find('Province').text
                card_name = order.find('CardName').text
                order_time = order.find('OrderTime').text
                order_status = order.find('OrderStartus').text
                order_status_desc = order.find('OrderStatusDesc').text
                order_finish_time = order.find('OrderFinishTime').text
                break

        except Exception as e:
            pass

        return {'card_open_tran_id': card_open_tran_id,
                'channel_order_id': channel_order_id,
                'impp_order_id': impp_order_id,
                'channel_id': channel_id,
                'province': province,
                'card_name': card_name,
                'order_time': order_time,
                'order_status': order_status,
                'order_status_desc': order_status_desc,
                'order_finish_time': order_finish_time,
                }


@tornado.gen.coroutine
def up_aspire(handler, partner):
    handler.up_req_time = time.localtime()

    openCard = AsipreOpenCard()
    transaction_id, body = openCard.produce_request_body(handler, partner)
    handler.up_order_id = transaction_id

    url = partner['url.open_card']

    request_log.info('CALL_REQ %s', body, extra={'orderid': handler.order_id})

    # call & wait
    response = None
    result = 99999

    http_client = AsyncHTTPClient()
    try:
        response = yield http_client.fetch(url, method='POST', body=body.encode('gbk'),
                                           validate_cert=False,
                                           request_timeout=120)
    except HTTPError as http_error:
        request_log.error('CALL UPSTREAM FAIL %s', http_error, extra={'orderid': handler.order_id})
        result = 60000 + http_error.code
    except Exception as e:
        request_log.error('CALL UPSTREAM FAIL %s', e, extra={'orderid': handler.order_id})

    handler.up_resp_time = time.localtime()

    need_query = True
    if response and response.code == 200:
        body = response.body.decode('gbk')
        request_log.info('CALL_RESP %s', body.replace('\n', ''), extra={'orderid': handler.order_id})

        response_result = openCard.parse_response(body)
        rsp_code = response_result.get('rsp_code')
        if rsp_code:
            need_query = False
            if rsp_code == "0000":
                result = 0
            else:
                result = 90000 + int(rsp_code)

    # 如果订单没有明确的成功和失败，那就需要进行查询操作
    if need_query:
        queryOrder = AspireQueryOrderStatus()

        body = queryOrder.produce_request_body(partner, transaction_id)

        request_log.info('CALL QUERYORDER REQ %s', body, extra={'orderid': handler.order_id})

        http_client = AsyncHTTPClient()
        try:
            response = yield http_client.fetch(url, method='POST', body=body.encode('gbk'), validate_cert=False,
                                               request_timeout=120)
        except HTTPError as http_error:
            request_log.error('CALL QUERYORDER FAIL %s', http_error, extra={'orderid': handler.order_id})
            result = 60000 + http_error.code
        except Exception as e:
            request_log.error('CALL QUERYORDER FAIL %s', e, extra={'orderid': handler.order_id})
            result = 99999

        if response and response.code == 200:
            body = response.body.decode('gbk')
            request_log.info('CALL_QUERYORDER_RESP %s', body, extra={'orderid': handler.order_id})

            response_result = queryOrder.parse_response(body)
            order_status = response_result.get('order_status')
            if order_status in ["4", "5"]:
                result = 0
            else:
                result = 90000 + int(order_status)

    handler.master.set('map:aspire:%s' % handler.up_order_id, handler.order_id)

    handler.up_result = result
    return result


if __name__ == "__main__":
    cfg = yaml.load(open('../../config.yaml', 'r', encoding='utf-8'))
    partner = cfg.get('upstream').get('aspire')
    channel_id = partner['channel_id']
    aeskey = base64.b64decode(partner['aeskey'])
    url = partner['url.query_sale_cards']

    saleCards = AspireQuerySaleCard()
    REQUEST = saleCards.produce_request_body(channel_id, aeskey)

    print(">>>REQUEST<<<")
    print(REQUEST)

    try:
        response = urllib.request.urlopen(url, REQUEST.encode('gbk'))

        if response.status != 200:
            print(response)
        else:
            RESPONSE = response.read().decode("gbk")
            print(">>>RESPONSE<<<")
            print(RESPONSE)

            card_info_list = saleCards.parse_response(RESPONSE)['card_info_list']
            for card in card_info_list:
                print(card)

    except Exception as e:
        print(e)
