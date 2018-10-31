#!/usr/bin/env bash

################################################################################
function command_exist()
{
    if [ $# -ne 1 ]; then
        return 1
    fi
    typeset cmd=$1
    which $cmd  1>/dev/null 2>&1
    if [ $? -ne 0 ];then
        return 1
    else
        return 0
    fi
}

################################################################################
function is_root()
{
    typeset user=`whoami`
    if [[ "X$user" != "Xroot" ]]; then
        return 1
    fi
    return 0
}

################################################################################
function is_notroot()
{
    typeset user=`whoami`
    if [[ "X$user" = "Xroot" ]]; then
        return 1
    fi
    return 0
}
