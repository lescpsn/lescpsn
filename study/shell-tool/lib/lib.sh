#!/usr/bin/env bash

################################################################################
function print_log() {
    if [ $# -ne 2 ]; then
        exit 1
    fi
    local level=$1
    local msg=$2
    local time=`date +"%Y-%m-%d %H:%M:%S"`
    local color_level

    case $level in
        "INFO")
            color_level="\033[32m[$level]\033[0m"
            ;;
        "ERRO")
            color_level="\033[31m[$level]\033[0m"
            ;;
        "WARN")
            color_level="\033[33m[$level]\033[0m"
            ;;
        *)
            ;;
    esac

    echo -e [$time]$color_level $msg
}

################################################################################
function is_root() {
    local user=`whoami`
    if [ $user != "root" ]; then
        return 1
    fi
    return 0
}

################################################################################
function read_ini() {
    local ini_file=$1
    local section=$2
    local key=$3
    #awk -F '=' '/\[$section\]/$1~/[^ *#]dbuser/ {gsub(/ /,"",$2);print $2;exit}' $ini_file
    awk -F '=' "/\[$section\]/\$1~/ *[^#] *$key/ {gsub(/ /,\"\",\$2);print \$2;exit}" $ini_file
}

################################################################################
function main_test() {
    # testing function print_log 
    # print_log "INFO" "我爱中华"
    # print_log "ERRO" "我爱中华"
    # print_log "ERROe" "我爱中华"

    # testing function is_root
    # is_root
    # ret=$?
    # echo "is_root:$ret"

    #read_ini "pg_config.ini" "postgres" "dbuser"
    return 0
}

################################################################################
main_test "$@"
