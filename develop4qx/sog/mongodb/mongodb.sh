#!/bin/sh

MONGOBIN=/home/carhj/local/mongodb/bin/mongod
CONFIG=/home/carhj/local/mongodb/mongodb.conf
do_start()
{
    echo "starting mongodb..."
    ${MONGOBIN} -f ${CONFIG}
}

do_stop()
{
    echo "stoping mongodb..."
    killall  mongod
}

do_status()
{
    echo "checking mongodb status..."
    pid=`ps -ef | grep "mongodb/bin/mongod" | grep -v "grep" | awk '{print $2}'`
    if [ "X${pid}" != "X" ]; then
        echo "mongodb(pid=${pid}) is running"
    else
        echo "mongodb is stopped"
    fi

}

case "$1" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    status)
        do_status
        ;;
    *)
        echo "parameter error."
        exit 1
        ;;
esac
