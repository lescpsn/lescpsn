#!/bin/bash
. ../lib.sh
OBJ_DIR=/usr/local
MONGODB_VERSION=mongodb-linux-x86_64-ubuntu1604-3.2.8
MONGODB_PKG=${MONGODB_VERSION}.tgz
MONGODB_DOWNURL=https://fastdl.mongodb.org/linux/${MONGODB_PKG}
################################################################################
function install_mongodb()
{
    wget ${MONGODB_DOWNURL}
    if [ $? -ne 0 ]; then
        rm -rf ${MONGODB_PKG}
        return 1
    fi
    if [ ! -e ${OBJ_DIR} ]; then
        mkdir -p ${OBJ_DIR}
    fi
    
    mongodpid=`ps -ef | grep "mongod " | grep -v "grep" | awk '{print $2}'`
    if [[ "X$mongodpid" != "X" ]]; then
	kill -9 $mongodpid
    fi
    
    rm -rf ${OBJ_DIR}/${MONGODB_VERSION} ${OBJ_DIR}/mongodb
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    
    tar -zxvf ${MONGODB_PKG} -C ${OBJ_DIR}
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    
    ln -s ${OBJ_DIR}/${MONGODB_VERSION} ${OBJ_DIR}/mongodb
    if [ ! -e ${OBJ_DIR}/mongodb/data ]; then
        mkdir -p ${OBJ_DIR}/mongodb/data
    fi
    touch ${OBJ_DIR}/mongodb/logs

    rm -rf ${MONGODB_PKG}
    return 0
}

################################################################################
function config_mongodb()
{
    cp -rf mongod.conf ${OBJ_DIR}/mongodb/
    cp -rf mongod.sh ${OBJ_DIR}/mongodb/bin/
    cp -rf mongod.service /lib/systemd/system/
    systemctl enable mongod.service
} 

################################################################################
function  main()
{
    is_root
    if [ $? -ne 0 ]; then
        return 1
    fi

    install_mongodb
    if [ $? -ne 0 ]; then
        return 1
    fi

    config_mongodb
    if [ $? -ne 0 ]; then
        return 1
    fi
    return 0
}

################################################################################
main "$@"
