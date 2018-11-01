import logging
from datetime import datetime
from pyspark import SparkConf, SparkContext, SparkFiles
from pyspark.sql import SQLContext, Row


log = logging.getLogger("request")


class SparkDriver:
    def __init__(self, config):
        self.config = config
        log.debug('SPARK_CONFIG: {0}'.format(config))

        spark_conf = SparkConf().setMaster(
                self.config['master']
            ).setAppName(
                datetime.now().strftime('%Y%m%d%H%M%S')
            )

        self.sc = SparkContext(conf=spark_conf)
        self.sqlContext = SQLContext(self.sc)

        # 测试代码
        if True:
            import os
            path = os.path.join('./', "test.txt")
            with open(path, "w") as testFile:
               _ = testFile.write("100")
            self.sc.addFile(path)


            result = self.sc.parallelize([1, 2, 3, 4]).mapPartitions(func).collect()
            print(">>>>>>>>>>>>>>>>>", result)


def func(iterator):
   with open(SparkFiles.get("test.txt")) as testFile:
       fileVal = int(testFile.readline())
       return [x * fileVal for x in iterator]


if __name__ == '__main__':
    import os
    config = {'master': 'spark://192.168.1.161:7077'}

    spark_driver = SparkDriver(config)









