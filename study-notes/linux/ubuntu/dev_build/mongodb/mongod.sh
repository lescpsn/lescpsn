#!/usr/bin/env bash

MONGODB=/usr/local/mongodb
MONGODB_CONF=/usr/local/mongodb/mongod.conf

start()
{
    echo "Starting mongodb..."
    $MONGODB/bin/mongod --config $MONGODB_CONF

}

stop()
{
    echo "Stopping mongodb..."
    $MONGODB/bin/mongod --config $MONGODB_CONF --shutdown

}

status()
{
    echo "mongodb is running."
    echo "mongodb is stopped."
}


restart()
{
    echo "Restarting mongodb..."
    start
    stop
}


case "$1" in
     start)
	 start
	 ;;

     stop)
	 stop
	 ;;

     status)
	 status
	 ;;

     restart)
	 restart
	 ;;
     *)
	 echo "Usage $0 {start|stop|status|restart}"
	 ;;
esac
