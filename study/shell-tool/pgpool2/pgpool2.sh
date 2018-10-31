#!/usr/bin/env bash

################################################################################
# include lib
. ../lib/lib.sh

##  时间的同步


################################################################################
OBJ_DIR=/usr/local/pgpool2

################################################################################
function download_pgpool2() {
    return 0
}

################################################################################
function install_pgpool2() {
    print_log "INFO" "Start installing postgresql-server-dev-all..."
    apt-get -y install postgresql-server-dev-all  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing postgresql-server-dev-all error."
        return 1
    fi
    print_log "INFO" "Installing postgresql-server-dev-all finished."

    print_log "INFO" "Start installing libpq-dev..."
    apt-get -y install libpq-dev  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "INFO" "Installing libpq-dev error."
        return 1
    fi
    print_log "INFO" "Installing libpq-dev finished."

    if [ ! -e $OBJ_DIR ]; then
        mkdir -p $OBJ_DIR
    fi
    if [ -e pgpool-II-3.6.0 ]; then
        rm -rf pgpool-II-3.6.0
    fi

    print_log "ERRO" "Start uncompressing pgpool-II-3.6.0.tar.gz..."
    tar -zxvf pgpool-II-3.6.0.tar.gz  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Uncompressing pgpool-II-3.6.0.tar.gz error."
        return 1
    fi
    print_log "INFO" "Uncompressing pgpool-II-3.6.0.tar.gz finish."

    cd pgpool-II-3.6.0

    print_log "INFO" "Start configuring pgpool-II-3.6.0..."
    ./configure --prefix=$OBJ_DIR  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Configuring pgpool-II-3.6.0 error."
        return 1
    fi
    print_log "INFO" "Configuring pgpool-II-3.6.0 finished."

    print_log "INFO" "Start complicing pgpool-II-3.6.0..."
    make  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "INFO" "Complicing pgpool-II-3.6.0 error."
        return 1
    fi
    print_log "INFO" "Complicing pgpool-II-3.6.0 finished."

    print_log "INFO" "Start installing pgpool-II-3.6.0.tar.gz..."
    make install  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing pgpool-II-3.6.0.tar.gz error."
        return 1
    fi
    print_log "INFO" "Installing pgpool-II-3.6.0.tar.gz finished."


    cd src/sql
    make  1>/dev/null 2>&1 && make install  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing pgpool-II-3.6.0 sql error."
    fi

    return 0
}

################################################################################
function main() {
    is_root
    if [ $? -ne 0 ]; then
        print_log "ERRO" "You must runing this script use root"
        return 1
    fi

    print_log "INFO" "Start downloading pg-pool2..."
    download_pgpool2
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Downloading pg-pool2 error."
        return 1
    fi
    print_log "INFO" "Downloading pg-pool2 finished."


    print_log "INFO" "Start installing pg-pool2..."
    install_pgpool2
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing pg-pool2 error."
        return 1
    fi
    print_log "INFO" "Installing pg-pool2 finished."
}
################################################################################
main "$@"
