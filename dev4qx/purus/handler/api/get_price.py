import json
import tornado
from handler import JsonHandler
from utils.escape import escape_area, escape_carrier


class ApiGetProductHandler(JsonHandler):
    @tornado.gen.coroutine
    def get(self):
        slave = self.slave

        user_id = self.current_user['partner_id']
        d = self.application.config['downstream'][user_id]

        master_id = d.get('master', user_id)

        product_key = slave.keys('product:%s:*' % master_id)

        product_list = {'1': [], '2': [], '3': []}

        for pid in product_key:
            info = slave.hmget(pid, ['offer', 'carrier', 'value', 'discount', 'name'])
            area = pid.split(':')[4]
            carrier = info[1]

            product_list[carrier].append({
                'offer': info[0],
                'carrier': carrier,
                'carrier_name': escape_carrier(carrier),
                'price': info[2],
                'value': (float(info[2]) * float(info[3]) / 10000),
                'name': info[4],
                'area': area,
                'area_name': escape_area(area),
            })

        self.finish(json.dumps({'msg': 'ok', 'product': product_list}))
