import logging
import xml.etree.ElementTree as ET

from handlers import BaseHandler, signature


request_log = logging.getLogger("madeira.request")


class BalanceHandler(BaseHandler):
    def get(self):
        self.post()

    def post(self):
        try:
            slave = self.slave

            user_id = self.get_argument('userid')
            sign = self.get_argument('sign').upper()

            request_log.info('REQUEST user=%s, sign=%s', user_id, sign, extra={'orderid': user_id})

            user = self.application.config['downstream'][user_id]
            if user is None or 'key' not in user:
                return self.finish("5005")

            sign2 = signature('userid={user_id}&key={key}'.format(user_id=user_id, key=user['key']))
            if sign != sign2:
                return self.finish("5005")

            balance = slave.get('point:%s' % user_id)
            if balance is None:
                balance = 0

            root = ET.Element('user')
            ET.SubElement(root, 'userid').text = user_id
            ET.SubElement(root, 'balance').text = str(float(balance) / 10000)
            ET.SubElement(root, 'resultno').text = '1'

            self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
            body = ET.tostring(root, encoding='gbk')

            request_log.info('RESPONSE %s', body, extra={'orderid': user_id})
            self.finish(body)
        except Exception as e:
            request_log.exception('BALANCE ERROR', extra={'orderid': 'UNKNOWN'})
            self.finish("9999")