# -*- coding:utf-8 -*-
import logging
from handlers import JsonHandler

log = logging.getLogger("request")
class SalesStatisticsHandler(JsonHandler):
    def get(self):
        log.info('SalesStatisticsHandler REQU [{0}] [{1}]'.format(self.requ_type, self.argu_list))
        if self.requ_type == 'query_sales_report':
            return self.query_sales_report()
        elif self.requ_type == 'query_brief_sales_report':
            return self.query_brief_sales_report()

        return self.resp_json_result('fail','未知请求')

    def query_sales_report(self):
        # 暂时调用测试代码
        #self.application.spark_driver.do_test()
        data_list = self.application.spark_driver.report_sales(self.argu_list)

        # data_list =[]
        return self.resp_json_result('ok','成功', {'data_list': data_list, 'page_info': None})

    def query_brief_sales_report(self):
        # 暂时调用测试代码
        #self.application.spark_driver.do_test()
        data_list = self.application.spark_driver.report_sales_brief(self.argu_list)
        return self.resp_json_result('ok','成功', {'data_list': data_list, 'page_info': None})
