#!/usr/bin/env bash

################################################################################
REDIS_USER=redis
REDIS_USER_HOMEDIR=/var/lib/redis
REDIS_USER_SHELL=/bin/false
REDIS_BIN_DIR=/usr/local/bin
REDIS_INSTANCE=madeira

function check_root()
{
    username=`id -un`
    if [ "X${username}" == "Xroot" ]; then
        return 0
    fi
    return 1
}

function create_redisuser()
{
    if id redis  1>/dev/null 2>&1; then
        userdel -r redis  1>/dev/null 2>&1
        if [ $?  -ne 0 ]; then
            return 1
        fi
    fi

    useradd -m -d ${REDIS_USER_HOMEDIR} -s ${REDIS_USER_SHELL} ${REDIS_USER}
    if [ $?  -ne 0 ]; then
        return 1
    fi
    return 0
}

function download_redis()
{
    echo "Download redis package from http://redis.io"
    echo -e "\033[32mUrl:http://download.redis.io/redis-stable.tar.gz\033[0m"
    rm -rf redis-stable*.tar.gz*
    wget http://download.redis.io/redis-stable.tar.gz
    if [ $? -ne 0 ]; then
        rm -rf redis-stable.tar.gz
        return 1
    fi

    return 0
}

function install_tcl()
{
    apt-get install -y tcl
    if [ $? -ne 0 ]; then
        return 1
    fi
    return 0
}

function install_redis()
{
    tar -zxvf redis-stable.tar.gz
    if [ $? -ne 0 ]; then
        return 1
    fi

    cd redis-stable
    make
    if [ $? -ne 0 ]; then
        return 1
    fi

    make test
    if [ $? -ne 0 ]; then
        return 1
    fi

    make install
    if [ $? -ne 0 ]; then
        return 1
    fi
    cd ..
}

function config_sys()
{
    echo "1024" >/proc/sys/net/core/somaxconn
    if grep "^net.core.somaxconn.* *= *1024" /etc/sysctl.conf  1>/dev/null 2>&1; then
        :
    else
        echo "net.core.somaxconn = 1024" >>/etc/sysctl.conf
    fi

    echo "1" >/proc/sys/vm/overcommit_memory
    if grep "^vm.overcommit_memory.* *= *1" /etc/sysctl.conf  1>/dev/null 2>&1; then
        :
    else
        echo "vm.overcommit_memory = 1"  >>/etc/sysctl.conf
    fi

    echo never  >/sys/kernel/mm/transparent_hugepage/enabled
    if grep "^echo never.*/sys/kernel/mm/transparent_hugepage/enabled" /etc/rc.local 1>/dev/null 2>&1; then
        :
    else
        echo "echo never  >/sys/kernel/mm/transparent_hugepage/enabled"  >>/etc/rc.local
    fi
    chmod +x /etc/rc.local
}

function config_redis()
{
    cp redis-stable/redis.conf ${REDIS_USER_HOMEDIR}/

    # config data dir
    sed -i "s#^ *dir .*#dir ${REDIS_USER_HOMEDIR}#"  ${REDIS_USER_HOMEDIR}/redis.conf

    # config remote connect
    sed -i "s/.*bind  *127.0.0.1.*/bind 0.0.0.0/"  ${REDIS_USER_HOMEDIR}/redis.conf

    # config daemon run
    sed -i "s/^ *daemonize.*/daemonize yes/"  ${REDIS_USER_HOMEDIR}/redis.conf

    # config log file
    sed -i "s#.*logfile.*#logfile /var/log/redis.log#"  ${REDIS_USER_HOMEDIR}/redis.conf

    cp redis-stable/sentinel.conf  ${REDIS_USER_HOMEDIR}/

    sed -i "s#^ *dir .*#dir ${REDIS_USER_HOMEDIR}#"  ${REDIS_USER_HOMEDIR}/sentinel.conf
    sed -i "s/mymaster/${REDIS_INSTANCE}/"  ${REDIS_USER_HOMEDIR}/sentinel.conf

    sed -i "s#^ *\(sentinel monitor.*\)  *[0-9]#\1 1#"  ${REDIS_USER_HOMEDIR}/sentinel.conf

    if grep "^ *${REDIS_BIN_DIR}/redis-server  *${REDIS_USER_HOMEDIR}/sentinel.conf  *--sentinel" /etc/rc.local 1>/dev/null 2>&1; then
        :
    else
        echo "${REDIS_BIN_DIR}/redis-server ${REDIS_USER_HOMEDIR}/sentinel.conf --sentinel &"  >>/etc/rc.local
    fi
    chmod +x /etc/rc.local

    cp -rf redisd /etc/init.d/
    update-rc.d redisd defaults
}

function main()
{
    check_root
    if [ $? -ne 0 ]; then
        echo "You must run this script as ROOT."
        return 1
    fi

    create_redisuser
    if [ $? -ne 0 ]; then
        echo "Creat redis user error."
        return 1
    fi

    download_redis
    if [ $? -ne 0 ]; then
        echo "Download redis error."
        return 1
    fi

    install_tcl
    if [ $? -ne 0 ]; then
        echo "Install tcl error."
        return 1
    fi

    install_redis
    if [ $? -ne 0 ]; then
        echo "Install redis error."
        return 1
    fi

    config_sys
    if [ $? -ne 0 ]; then
        echo "Config system  error."
        return 1
    fi

    config_redis
    if [ $? -ne 0 ]; then
        echo "Config redis error."
        return 1
    fi
}
################################################################################
main "$@"
