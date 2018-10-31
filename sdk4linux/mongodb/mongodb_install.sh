#!/bin/bash
. ../libsh/lib.sh

OBJ_DIR=/usr/local
MONGODB_DOWNURL=https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-3.2.4.tgz
MONGODB_PKG=mongodb-linux-x86_64-ubuntu1404-3.2.4.tgz
MONGODB_VERSION=mongodb-linux-x86_64-ubuntu1404-3.2.4

################################################################################
function option_mongo()
{
    typeset mongoclient="/usr/local/mongodb/bin/mongo"
    $mongoclient <<EOF
show dbs
use admin
EOF
    echo $?
}

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

    rm -rf ${OBJ_DIR}/${MONGODB_VERSION} ${OBJ_DIR}/mongodb
    tar -zxvf ${MONGODB_PKG} -C ${OBJ_DIR}
    ln -s ${OBJ_DIR}/${MONGODB_VERSION} ${OBJ_DIR}/mongodb
    if [ ! -e ${OBJ_DIR}/mongodb/data ]; then
        mkdir -p ${OBJ_DIR}/mongodb/data
    fi

    touch ${OBJ_DIR}/mongodb/logs
    return 0
}

################################################################################
function config_mongodb()
{
    # 创建启动脚本
    echo "${OBJ_DIR}/mongodb/bin/mongod --dbpath=${OBJ_DIR}/mongodb/data \
--logpath=${OBJ_DIR}/mongodb/logs --logappend \
--port=27017 --fork" >${OBJ_DIR}/mongodb/start.sh
    chmod +x ${OBJ_DIR}/mongodb/start.sh

    cp  -rf mongodb.conf /etc/mongodb.conf
    if grep "^ *export PATH=\$PATH:$OBJ_DIR/mongodb/bin" /etc/profile; then
        :
    else
        echo "export PATH=\$PATH:$OBJ_DIR/mongodb/bin"  >>/etc/profile
    fi
}

################################################################################
function  main()
{
    is_root
    if [ $? -ne 0 ]; then
        print_log "ERRO" "The Current user is not root!"
        return 1
    fi

    print_log "INFO" "Start installing mongodb..."
    install_mongodb
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing mongodb failed."
        return 1
    fi
    print_log "INFO" "Installing mongodb..."

    print_log "INFO" "Start configing mongodb..."
    config_mongodb

    if [ $? -ne 0 ]; then
        print_log "INFO" "Configing mongodb error."
        return 1
    fi
    print_log "INFO" "Configing mongodb finished."

#    option_mongo
    return 0
}

################################################################################
main "$@"
