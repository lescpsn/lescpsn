import logging
import xml.etree.ElementTree as ET

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.shard import get_order_shard
from handlers import BaseHandler, signature

request_log = logging.getLogger("madeira.request")


class QueryHandler(BaseHandler):
    def get(self):
        self.post()

    def from_db(self, user_id, sp_order_id):
        info = ''
        engine = create_engine(
            self.application.config['database']['url'], pool_size=1, echo=True, echo_pool=True, pool_recycle=3600)

        session = None
        try:
            session = sessionmaker(bind=engine)()
            order_cls = get_order_shard(user_id)

            o = session.query(order_cls).filter(order_cls.sp_order_id == sp_order_id).first()

            if o:
                order = ET.Element('order')
                ET.SubElement(order, 'orderid').text = o.order_id
                ET.SubElement(order, 'num').text = '1'
                ET.SubElement(order, 'ordercash').text = str((o.value or 0) / 10000)
                ET.SubElement(order, 'sporderid').text = o.sp_order_id
                ET.SubElement(order, 'account').text = o.mobile
                ET.SubElement(order, 'resultno').text = o.back_result or o.result
                info = ET.tostring(order, encoding='gbk')

                request_log.info("FEE QUERY FROM DB %s", info, extra={'orderid': o.order_id})

            else:
                order = ET.Element('order')
                ET.SubElement(order, 'orderid').text = ''
                ET.SubElement(order, 'sporderid').text = sp_order_id
                ET.SubElement(order, 'resultno').text = '5007'
                info = ET.tostring(order, encoding='gbk')

                request_log.info("FEE QUERY FROM DB %s", info, extra={'orderid': 'UNKNOWN'})

        except Exception:
            request_log.exception("QUERY FAIL", extra={'orderid': 'UNKNOWN'})
        finally:
            if session:
                session.close()

        return info

    def post(self):
        request_log.info('FEE QUERY BODY {%s}', self.request.body.decode(), extra={'orderid': 'UNKNOWN'})

        try:
            slave = self.slave
            user_id = self.get_argument('userid')
            sp_order_id = self.get_argument('sporderid')
            sign = self.get_argument('sign')

            user = self.application.config['downstream'].get(user_id)
            if user is None:
                self.send_error(500)
                return

            if sign:
                key = user.get('key')
                sign0 = signature('userid={user_id}&sporderid={sp_order_id}&key={key}'.format(
                    user_id=user_id, sp_order_id=sp_order_id, key=key))

                if sign != sign0:
                    order = ET.Element('order')
                    ET.SubElement(order, 'resultno').text = '5005'
                    request_log.info('FEE QUERY SIGN FAIL %s %s %s', sp_order_id, sign, sign0,
                                     extra={'orderid': sp_order_id})
                    self.finish(ET.tostring(order, encoding='gbk'))
                    return

            order_id = slave.get('map:%s:%s' % (user_id, sp_order_id))

            in_cache = False
            if order_id:
                in_cache = slave.exists('order:%s' % order_id)

            if order_id is None or not in_cache:
                info = self.from_db(user_id, sp_order_id)
                self.finish(info)
                return

            data = slave.hgetall('order:%s' % order_id)

            if 'value' in data:
                value = int(data['value'])
            else:
                value = 0
            if 'mobile' in data:
                mobile = data['mobile']
            else:
                mobile = ''

            if 'back_result' in data:
                result = data['back_result']
            else:
                if 'result' in data:
                    result = data['result']
                else:
                    result = '9999'

            order = ET.Element('order')
            ET.SubElement(order, 'orderid').text = order_id
            ET.SubElement(order, 'num').text = '1'
            ET.SubElement(order, 'ordercash').text = str(value / 10000)
            ET.SubElement(order, 'sporderid').text = sp_order_id
            ET.SubElement(order, 'account').text = mobile
            ET.SubElement(order, 'resultno').text = result

            self.set_header('Access-Control-Allow-Origin', '*')  # for web-based debugger
            body = ET.tostring(order, encoding='gbk')

            request_log.info('FEE QUERY RESPONSE %s', body, extra={'orderid': order_id})
            self.finish(body)

        except:
            request_log.exception('FEE QUERY ERROR', extra={'orderid': 'UNKNOWN'})
            self.write_error(500)
