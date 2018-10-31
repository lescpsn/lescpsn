# -*- coding:utf-8 -*-
import sys
import yaml
import logging
import logging.config
import tornado.web
import tornado.httpserver
from handlers.admin.reload import ReloadHandler
from handlers.sales_statistics import SalesStatisticsHandler
from datetime import datetime,timedelta

LOGO = '''
                            __                   __          __  .__          __  .__
  _________________ _______|  | __       _______/  |______ _/  |_|__| _______/  |_|__| ____   ______
 /  ___/\____ \__  \\\\_  __ \  |/ /      /  ___/\   __\__  \\\\   __\  |/  ___/\   __\  |/ ___\ /  ___/
 \___ \ |  |_> > __ \|  | \/    <       \___ \  |  |  / __ \|  | |  |\___ \  |  | |  \  \___ \___ \\
/____  >|   __(____  /__|  |__|_ \_____/____  > |__| (____  /__| |__/____  > |__| |__|\___  >____  >
     \/ |__|       \/           \/_____/    \/            \/             \/               \/     \/
(C)2016 Quxun Network
'''
# powered by http://patorjk.com/software/taag

cfg = yaml.load(open('logging.yaml', 'r'))
logging.config.dictConfig(cfg)
log = logging.getLogger('request')

class Application(tornado.web.Application):
    def __init__(self):
        self.load_config()
        handlers = [
            (r'/report/sales_statistics', SalesStatisticsHandler),

            #reload config
            (r'/admin/reload', ReloadHandler),
        ]

        settings = dict(
            debug=self.config['config']['debug']
        )

        tornado.web.Application.__init__(self, handlers, **settings)


    def load_config(self):
        config = yaml.load(open('config.yaml', 'r', encoding='utf8'))


        self.config = config

        self.spark_driver = SparkDriver(self.config['spark'])


#由于会报出各种莫名其妙的错误， 因此把调用pyspark的所有代码都放在主函数所在文件

#spark测试代码
def test_func(iterator):
   with open(SparkFiles.get('test.txt')) as testFile:
       fileVal = int(testFile.readline())
       return [x * fileVal for x in iterator]

from pyspark import SparkConf, SparkContext, SparkFiles
from pyspark.sql import SQLContext, Row
class SparkDriver:
    def __init__(self, config):
        self.config = config
        log.debug('SPARK_CONFIG: {0}'.format(config))

        #获取需要进行计算的文件列表
        path = self.config['data_path']
        file_list = []
        import os
        dir_list = os.listdir(path)
        for d in dir_list:
            d2 = os.path.join(path,d)
            if not os.path.isfile(d2):
                continue

            n, e = os.path.splitext(d)
            if e == '.csv':
                file_list.append(d2)

        file_list = sorted(file_list,reverse = True)

        if 'file_count' in self.config and self.config['file_count'] != -1 and len(file_list) > self.config['file_count']:
            file_list = file_list[:self.config['file_count']]

        # 配置spark的上下文
        spark_conf = SparkConf().setMaster(
                self.config['master']
            ).setAppName(
                datetime.now().strftime('%Y%m%d%H%M%S')
            ).set(
                'spark.executor.memory', self.config['executor_memory']
            )

        self.sc = SparkContext(conf=spark_conf)
        self.sqlContext = SQLContext(self.sc)

        # 读取文件列表
        parts_list = []
        for name in file_list:
            log.debug('+++++ADD FILE:  '+name)
            lines = self.sc.textFile(name)
            parts = lines.map(lambda l: l.split(','))
            parts_list.append(parts)

        log.debug('@@@@@DATA FILE COUNT({0})'.format(len(parts_list)))
        parts = self.sc.union(parts_list)
        reportInfo = parts.map(lambda p: Row(order_count=1, order_id=p[0],
                downstream=p[1],
                face_value=float(p[2])*10000,
                mobile=p[3],
                start_time=p[4] and p[4] != '' and p[4] != 'None' and int(p[4]) or 0,
                end_time= p[5] and p[5] != '' and p[5] != 'None' and int(p[5]) or 0,
                order_status=[p[6], '9'][p[6] not in ('0', '1')],
                downstream_price= p[7] and p[7] !='' and p[7] != 'None' and int(p[7]) or 0,
                carrier=p[8],
                area=p[9],
                product_type=p[10],
                upstream=p[11],
                upstream_price=p[12] and p[12] !='' and p[12] != 'None' and int(p[12]) or 0,
                profit=[0, p[12] and (p[7] and p[7] !='' and p[7] != 'None' and int(p[7]) or 0) - (p[12] and p[12] !='' and p[12] != 'None' and int(p[12]) or 0) ][ p[6] == '1'],
            )
        )

        self.sales_temp_table = self.sqlContext.createDataFrame(reportInfo)
        self.sales_temp_table.registerTempTable('sales_temp_table')
        execSql='''
            SELECT
            SUM(order_count) AS total_order_count,
            downstream,
            SUM(face_value) AS total_face_value,
            start_time,
            order_status,
            SUM(downstream_price) AS total_downstream_price,
            carrier,
            area,
            upstream,
            SUM(upstream_price) AS total_upstream_price,
            SUM(profit) AS total_profit
            FROM sales_temp_table
            GROUP BY
            downstream,
            start_time,
            end_time,
            order_status,
            carrier,
            area,
            upstream
        '''
        log.info('\033[32mc*********reating sales_cache_table sql=%s\033[0m' % execSql)
        sqlResult = self.sqlContext.sql(execSql)
        #将原始表转换成用于查询的表，并保存到内存中去，必须采用一个动作的方法（如：collect）才能载入内存成功
        sqlResult.registerTempTable('sales_cache_table')
        #perist(MEMORY_AND_DISK)  #->内存加硬盘模式
        self.sqlContext.cacheTable('sales_cache_table')
        self.sqlContext.sql('SELECT * FROM sales_cache_table').collect()
        #用于查询的目标表载入内存完成

        # 测试代码
        if True:
            import os
            path = os.path.join('./', 'test.txt')
            with open(path, 'w') as testFile:
                testFile.write('100')
            self.sc.addFile(path)
            result = self.sc.parallelize([1, 2, 3, 4]).mapPartitions(test_func).collect()
            log.info('SPARK TEST RESULT: {0}'.format(result) )

    # 销售数据的详细报表
    def report_sales(self, argu_list):
        # 暂时不处理分页的数据
        argu_list.pop('page_index')
        argu_list.pop('page_size')

        query_start_time = argu_list['query_start_time']
        query_end_time = argu_list['query_end_time']

        argu_list['query_start_time'] = datetime.strptime(argu_list['query_start_time'], '%Y/%m/%d')
        argu_list['query_end_time'] = datetime.strptime(argu_list['query_end_time'], '%Y/%m/%d') + timedelta(days=1)

        # 删除值为空的过滤条件
        # argu_list = {k: argu_list[k] for k in argu_list if argu_list[k] and argu_list[k] != '' }

        if 'query_start_time' in argu_list:
            argu_list['query_start_time'] = int( argu_list['query_start_time'].timestamp() )

        if 'query_end_time' in argu_list:
            argu_list['query_end_time'] = int( argu_list['query_end_time'].timestamp() )

        log.info('SparkDriver report REQU: {0}'.format(argu_list) )

        # 组装SQL语句
        #需要显示的列,
        select_sql = '''
            SELECT
            SUM(total_face_value) as total_face_value,
            SUM(total_downstream_price) as total_downstream_price,
            SUM(total_upstream_price) as total_upstream_price,
            SUM(total_profit) as total_profit,
            SUM(total_order_count) as total_order_count,'''
        where_sql = 'WHERE (start_time>={query_start_time}) AND (start_time<{query_end_time})'.format(
            query_start_time=argu_list['query_start_time'],
            query_end_time=argu_list['query_end_time'],
            )
        argu_list.pop('query_start_time')
        argu_list.pop('query_end_time')

        groupby_sql = 'GROUP BY'
        for key in argu_list:
            if argu_list[key] == '':  #全部
                continue

            select_sql += ' {0},'.format(key)
            groupby_sql += ' {0},'.format(key)

            if argu_list[key] == '@':#全选
                continue
            elif isinstance(argu_list[key], list): #数组处理
                value_list = ''
                for value in argu_list[key]:
                    value_list += '"{0}",'.format(value)
                if value_list != '':
                    value_list = value_list[:-1]
                where_sql += ' AND {key} IN ({value_list})'.format(key=key, value_list=value_list)
            else:
                where_sql += ' AND {key}="{value}"'.format(key=key, value=argu_list[key])

        default_upstream = '未知'
        if 'upstream' in argu_list and argu_list['upstream'] == '':
            default_upstream = '全部'

        default_downstream = '未知'
        if 'downstream' in argu_list and argu_list['downstream'] == '':
            default_downstream = '全部'

        select_sql = select_sql[:-1]
        if groupby_sql != 'GROUP BY':
            groupby_sql = groupby_sql[:-1]
        else:
            groupby_sql = ''

        query_sql = '{select_sql} FROM sales_cache_table {where_sql} {groupby_sql}'.format(
            select_sql=select_sql,
            where_sql=where_sql,
            groupby_sql=groupby_sql
        )

        # query_sql = ''
        # with open('./test.sql', 'r') as f:
        #     query_sql = f.read()

        log.info('\033[32m*************query_sql=%s\033[0m ' % query_sql)
        query_result = self.sqlContext.sql(query_sql)
        query_output = query_result.collect()
        data_list=[]
        for data in query_output:
            data = data.asDict()
            log.debug(data)

            total_face_value = data['total_face_value'] != None and data['total_face_value'] or 0
            total_downstream_price = data['total_downstream_price'] != None and data['total_downstream_price'] or 0
            total_upstream_price = data['total_upstream_price'] != None and data['total_upstream_price'] or 0
            total_order_count = data['total_order_count'] != None and data['total_order_count'] or 0
            total_profit = data['total_profit'] != None and data['total_profit'] or 0

            one_line = {
                'date_range': query_start_time + '-' + query_end_time,
                'order_status': 'order_status' in data and data['order_status'] or '',
                'upstream': 'upstream' in data and data['upstream'] or default_upstream,
                'downstream': 'downstream' in data and data['downstream'] or default_downstream,
                'carrier': 'carrier' in data and data['carrier'] or '',
                'area': 'area' in data and data['area'] or '',
                'total_face_value': total_face_value,
                'total_downstream_price': total_downstream_price,
                'total_upstream_price': total_upstream_price,
                'total_order_count': total_order_count,
                'total_profit': total_profit
            }
            data_list.append(one_line)

        return data_list

    # 销售数据的概要报表
    def report_sales_brief(self, argu_list):
        # 暂时不处理分页的数据
        argu_list.pop('page_index')
        argu_list.pop('page_size')
        query_start_time = argu_list['query_start_time']
        query_end_time = argu_list['query_end_time']

        argu_list['query_start_time'] = datetime.strptime(argu_list['query_start_time'], '%Y/%m/%d')
        argu_list['query_end_time'] = datetime.strptime(argu_list['query_end_time'], '%Y/%m/%d') + timedelta(days=1)

        if 'query_start_time' in argu_list:
            argu_list['query_start_time'] = int( argu_list['query_start_time'].timestamp() )

        if 'query_end_time' in argu_list:
            argu_list['query_end_time'] = int( argu_list['query_end_time'].timestamp() )

        log.info('SparkDriver report REQU: {0}'.format(argu_list) )

        # 组装SQL语句
        #需要显示的列,
        select_sql = '''
            SELECT
            SUM(total_downstream_price) as total_downstream_price,
            SUM(total_order_count) as total_order_count,'''
        where_sql = 'WHERE (start_time>={query_start_time}) AND (start_time<{query_end_time})'.format(
            query_start_time=argu_list['query_start_time'],
            query_end_time=argu_list['query_end_time'],
            )
        argu_list.pop('query_start_time')
        argu_list.pop('query_end_time')

        groupby_sql = 'GROUP BY'
        for key in argu_list:
            if argu_list[key] == '':  #全部
                continue

            select_sql += ' {0},'.format(key)
            groupby_sql += ' {0},'.format(key)

            if argu_list[key] == '@':#全选
                continue
            elif isinstance(argu_list[key], list): #数组处理
                value_list = ''
                for value in argu_list[key]:
                    value_list += '"{0}",'.format(value)
                if value_list != '':
                    value_list = value_list[:-1]
                where_sql += ' AND {key} IN ({value_list})'.format(key=key, value_list=value_list)
            else:
                where_sql += ' AND {key}="{value}"'.format(key=key, value=argu_list[key])

        default_downstream = '未知'
        if 'downstream' in argu_list and argu_list['downstream'] == '':
            default_downstream = '全部'

        select_sql = select_sql[:-1]
        if groupby_sql != 'GROUP BY':
            groupby_sql = groupby_sql[:-1]
        else:
            groupby_sql = ''

        query_sql = '{select_sql} FROM sales_cache_table {where_sql} {groupby_sql}'.format(
            select_sql=select_sql,
            where_sql=where_sql,
            groupby_sql=groupby_sql
        )

        log.info('\033[32m*************query_sql=%s\033[0m ' % query_sql)
        query_result = self.sqlContext.sql(query_sql)
        query_output = query_result.collect()

        #组装返回数据格式
        all_total_downstream_price = 0
        for data in query_output:
            all_total_downstream_price += data['total_downstream_price']

        data_list=[]
        for data in query_output:
            data = data.asDict()
            log.debug(data)
            total_downstream_price = data['total_downstream_price'] != None and data['total_downstream_price'] or 0
            total_order_count = data['total_order_count'] != None and data['total_order_count'] or 0
            one_line = {
                'date_range': query_start_time + '-' + query_end_time,
                'downstream': 'downstream' in data and data['downstream'] or default_downstream,
                'carrier': 'carrier' in data and data['carrier'] or '',
                'total_downstream_price': total_downstream_price,
                'total_order_count': total_order_count,
                'percentage':("%.2f%%" % (total_downstream_price*100/all_total_downstream_price))
            }
            data_list.append(one_line)
        return data_list

if __name__ == '__main__':
    application = Application()
    port = application.config['config']['port']
    http_server = tornado.httpserver.HTTPServer(application, xheaders=True)
    http_server.listen(port)

    log.info(LOGO)
    log.info('Listen on http://localhost:{0}/admin/reload'.format(port))

    #设置自动退出时间
    time_now = datetime.now()
    exit_time = time_now + timedelta(days=0)
    if time_now.hour > application.config['config']['exit_hour']:
        exit_time = time_now + timedelta(days=1)
    exit_time = exit_time.replace(hour=application.config['config']['exit_hour'], minute=0,second=0,microsecond=0)
    exit_seconds = exit_time.timestamp()-time_now.timestamp()
    log.info('SET EXIT TIME AT {0} {1}S'.format( str(exit_time), exit_seconds))
    tornado.ioloop.IOLoop.instance().call_later(exit_seconds, sys.exit)

    tornado.ioloop.IOLoop.instance().start()
