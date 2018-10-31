#!/usr/bin/env bash

################################################################################
function install_micro()
{
    # install consul
    go get github.com/hashicorp/consul

    # install go-micro
    go get github.com/micro/go-micro
}

################################################################################
function init_service()
{
    micro web 1>/dev/null 2>&1 &
}

################################################################################
function main()
{
    install_micro
    #init_service
}

################################################################################
main "$@"
