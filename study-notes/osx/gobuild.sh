#!/usr/bin/env bash

################################################################################
function install_go()
{
    echo "Starting install golang......"
    brew install go  1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        return -1
    fi
    echo "Installing golang finish."
}

################################################################################
function config_go()
{
    echo "Starting config golang......"
    shell=`echo "$SHELL"`
    shell=`basename $shell`
    if [ "X$shell" = "Xfish" ]; then
        echo "fish shell"
    else
        echo "please config PATH by manual in [$shell]"
    fi
    echo "Configing golang finish."    
}

################################################################################
function main()
{
    install_go
    if [ $? -ne 0 ]; then
        return -1
    fi

    config_go
    if [ $? -ne 0 ]; then
        return -1
    fi
}

################################################################################
main "$@"
