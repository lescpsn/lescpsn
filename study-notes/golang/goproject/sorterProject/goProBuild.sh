#!/usr/bin/env bash

function main()
{
    if [ $# -ne 1 ]; then
        return 1
    fi
    opt=$1
    if [ "X$opt" == "X-b" ]; then
        mkdir bin pkg src
    elif [ "X$opt" == "X-d" ]; then
        rm -rf bin/ pkg/ src/
    fi
}
################################################################################
main "$@"
