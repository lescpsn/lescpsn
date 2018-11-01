# JDK config
export JAVA_HOME=/usr/lib/jdk
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=${JAVA_HOME}/bin:$PATH
 
# SPARK config
export SPARK_HOME=/spark/spark
 
# PYTHON config
export PYSPARK_PYTHON=/spark/env/bin/python3
export PYTHONPATH=/spark/env
export PYTHONPATH=${SPARK_HOME}/python:${SPARK_HOME}/python/build:${PYTHONPATH}

# 挂载nfs 文件夹  rc.local
# sudo mount -t nfs 192.168.1.92:/spark/data /spark/data

sudo mount -t nfs 192.168.1.92:/spark/data /spark/data
