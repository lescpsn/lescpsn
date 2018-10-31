#!/usr/bin/env bash

. ../lib.sh

DB_NAME="mean"
DB_USER="lincan"
DB_PASS="123456"

################################################################################
function install_postgresql()
{
    apt-get -y install postgresql
}

################################################################################
function create_dbuser()
{
    su - postgres -c  "psql -c \"DROP USER ${DB_USER}\""
    su - postgres -c  "psql -c \"CREATE USER ${DB_USER} WITH SUPERUSER PASSWORD '${DB_PASS}';\""
    su - postgres -c  "psql -c \"DROP DATABASE ${DB_NAME};\""
    su - postgres -c  "psql -c \"CREATE DATABASE ${DB_NAME};\""
}

################################################################################
function main()
{
    is_root
    if [ $? -ne 0 ]; then
        return 1
    fi

    install_postgresql
    if [ $? -ne 0 ]; then
        return 1
    fi

    create_dbuser
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
main "$@"
