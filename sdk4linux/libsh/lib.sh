#!/usr/bin/env bash

################################################################################
function is_root()
{
    typeset user=`whoami`
    if [ "X$user" != "Xroot" ]; then
        return 1
    fi
    return 0
}

################################################################################
function is_command_exist()
{
    echo "this is function is_command_exist"
    typeset command=$1
    which ${command}  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        return 1
    fi

    return 0
}

################################################################################
function format_date()
{
    typeset year=`date +%Y`
    typeset month=`date +%m`
    typeset day=`date +%d`
    typeset hour=`date +%H`
    typeset minute=`date +%M`
    typeset second=`date +%S`
}

################################################################################
function print_log()
{
    if [ $# -ne 2 ]; then
        return 1
    fi

    typeset level=$1
    typeset log=$2
    typeset date=`date "+%Y-%m-%d %H:%M:%S"`

    if [ "X${level}" = "XINFO" ]; then
        printf "[$date] \033[32m[INFO]\033[0m [$log]\012"
    elif [ "X${level}" = "XERRO" ]; then
        printf "[$date] \033[31m[ERRO]\033[0m [$log]\012"
    fi
}
