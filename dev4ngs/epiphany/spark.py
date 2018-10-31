# -*- coding:utf-8 -*-

# This file spark is created by lincan for Project Epiphany
# on a date of 3/9/16 - 10:33 AM

from pyspark import SparkContext, SparkConf
from epiphany import Epiphany


def init_spark():
    conf = SparkConf() \
        .setAppName("Epiphany") \
        .setMaster("local")

    sc = SparkContext(conf=conf)

    e = Epiphany(sc)
    e.calculate_score()

if __name__ == '__main__':
    init_spark()
