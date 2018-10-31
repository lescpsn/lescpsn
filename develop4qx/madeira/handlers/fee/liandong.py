import logging
import time
import urllib
from xml.etree import ElementTree

import tornado
from tornado.httpclient import AsyncHTTPClient

from handlers import signature


request_log = logging.getLogger("madeira.request")


class MixinLiandong(object):
    @tornado.gen.coroutine
    def up_liandong(self, config):
        """联动通讯
            oid	商家订单编号	32	不可空	商户系统自己生成的订单号
            cid	商家编号	20	不可空	商户注册的时候产生的一个商户ID
            pr	单位面值	10	不可空	您所充值的单位商品面值
            nb	商品数量	1	不可空	您所需要充值的充值数量（固定为1）
            fm	充值金额	10	不可空	充值金额=商品面值*商品数量
            pn	充值号码	11	不可空	您所需要充值的帐号信息
            ct	充值类型		可以空	充值类型，缺省为快充
            ru	通知地址		不可空	通知地址,根据协议2.4充值结果通知，返回充值结果
            tsp	时间戳	14	不可空	请求时间戳，格式yyyyMMddHHmmss
            info1	扩展参数I	128	可以空
            info1	扩展参数II	128	可以空
            info1	扩展参数III	128	可以空
            sign	签名		不可空	原串拼接规则:
            md5({oid}{cid}{pr}{nb}{fm}{pn}{ru}{tsp}{key})
        """

        partner = self.application.config['upstream']['liandong']

        tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())

        print(partner['key'])
        # sign md5({oid}{cid}{pr}{nb}{fm}{pn}{ru}{tsp}{key})
        sign = signature(self.order_id, partner['cid'], self.price, '1', self.price, self.mobile, partner['ru'], tsp,
                         partner['key'])

        # package
        url = '{url}?oid={oid}&cid={cid}&pr={pr}&nb=1&fm={pr}&pn={pn}&ru={ru}&tsp={tsp}&sign={sign}'.format(
            url=partner['url.order'],
            oid=self.order_id,
            cid=partner['cid'],
            pr=self.price,
            pn=self.mobile,
            ru=urllib.parse.quote(partner['ru']),
            tsp=tsp,
            sign=sign)

        request_log.info('UP_REQ liandong - %s', url, extra={'orderid': self.order_id})

        # call & wait
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(url)

        body = response.body.decode('gbk')
        request_log.info('UP_RESP liandong - %d:%s', response.code, body, extra={'orderid': self.order_id})

        if response.code == 200:
            root = ElementTree.fromstring(body)
            if root.find('result').text == 'true' and root.find('code').text == '100':
                self.up_order_id = root.find('sid').text
                self.result = root.find('code').text
            else:
                self.result = root.find('code').text
        else:
            return '9999'