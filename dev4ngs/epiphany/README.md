# Epiphany 介绍

## 热度

热度是图说软件中用于定义用户活跃度的一个数值，这个数值由用户的行为和操作决定，同时会考虑到操作的联系性。


## SPARK

简单的介绍一下 SPARK。SPARK 全称是 Apche Spark，是 Apche 基金会下的实时大数据处理系统。Spark 和传统 MapReduce / Hadoop 不同之处在于 Spark 尽可能的将数据储存在内存中以加快处理速度，从而达到实时处理。

### Spark Context

SparkContext(sc) 是 spark 的上下文对象。

### RDD

RDD 是 SPARK 中的关键概念，是 SPARK 用户储存数据的对象，RDD 通过 SparkContext 创建，RDD 可以想象成一个个的池子，里面填充的不同的数据，这些数据会被分散到一台台 worker 上，等待处理。

## STORE

