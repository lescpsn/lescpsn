import random
import string
import time

from sqlalchemy import desc
import xlsxwriter
from db.madeira import get_order_shard

import utils


def export_task(request):
    redis = request.redis
    partner_id = request.current_user['partner_id']

    args = request.json_args
    print(args)
    page = int(args['page'])
    size = int(args['size'])

    user_id = args['user_id']

    partner_id = request.current_user['partner_id']

    session = request.session()

    result = []
    order_cls = get_order_shard(user_id)
    q = session.query(order_cls).filter(order_cls.partner_id == partner_id)

    # filter
    if args['number']:
        q = q.filter(order_cls.number == args['number'])
    if args['start'] and args['end']:
        start = time.strptime(args['start'], '%Y/%m/%d %H:%M:%S')
        end = time.strptime(args['end'], '%Y/%m/%d %H:%M:%S')
        q = q.filter(order_cls.create_time >= start) \
            .filter(order_cls.create_time <= end)
    if args['status']:
        q = q.filter(order_cls.status == args['status'])
    if args['batch']:
        q = q.filter(order_cls.batch_id == args['batch'])

    q = q.order_by(desc(order_cls.order_id)).limit(1000)

    filename = ''.join(random.sample(string.ascii_uppercase + string.digits * 6, 6))
    path = 'exports/%s.xlsx' % filename
    workbook = xlsxwriter.Workbook(path)
    worksheet = workbook.add_worksheet()

    # 0         1       2       3       4   5        6
    # 订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
    worksheet.write(0, 0, '订单编号')
    worksheet.write(0, 1, '手机号')
    worksheet.write(0, 2, '产品名称')
    worksheet.write(0, 3, '运营商')
    worksheet.write(0, 4, '面值')
    worksheet.write(0, 5, '采购金额')
    worksheet.write(0, 6, '开始时间')
    worksheet.write(0, 7, '状态时间')
    worksheet.write(0, 8, '批次号')
    worksheet.write(0, 9, '订单状态')
    worksheet.write(0, 10, '备注')

    worksheet.set_column(0, 0, 25)
    worksheet.set_column('B:J', 10)

    date_format = workbook.add_format({'num_format': 'yyyy/mm/dd hh:mm:ss'})
    row = 1
    for order in q:
        k = 'product/%s/%s' % (partner_id, order.offer_id)
        offer_name = redis.hget(k, 'name') or order.offer_id

        worksheet.write(row, 0, order.order_id)
        worksheet.write(row, 1, order.number)
        worksheet.write(row, 2, offer_name)
        worksheet.write(row, 3, '')
        worksheet.write(row, 4, '%.2f' % (order.face_value / 1000))
        worksheet.write(row, 5, '%.2f' % (order.price / 1000))
        worksheet.write(row, 6, order.create_time, date_format)
        worksheet.write(row, 7, order.update_time, date_format)
        worksheet.write(row, 8, order.batch_id)
        worksheet.write(row, 9, utils.escape_status(order.status))
        worksheet.write(row, 10, order.notes)
        # worksheet.write,
        row += 1

    workbook.close()

    return path

