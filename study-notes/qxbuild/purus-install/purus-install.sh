#!/usr/bin/env bash

PURUS_DIR=~/qxdevelop/purus
PURUS_URL=https://git.quxun.io/core/purus.git

################################################################################
function get_purus()
{
    if [ -e ${PURUS_DIR} ]; then
        rm -rf ${PURUS_DIR}
    fi
    git clone ${PURUS_URL} ${PURUS_DIR}
    if [ $? -ne 0 ]; then
        return 1
    fi
    cp -rf *.yaml ${PURUS_DIR}/
    cp -rf area_v3.bin ${PURUS_DIR}/
    cp -rf fonts ${PURUS_DIR}/
    mkdir -p ${PURUS_DIR}/logs/
    return 0
}

################################################################################
function pkg_install()
{
    username=`id -un`
    if [ "X${username}" == "Xroot" ]; then
        apt-get install libjpeg-dev libpng-dev libfreetype6-dev
    else
        sudo apt-get install libjpeg-dev libpng-dev libfreetype6-dev
    fi

    if [ $? -ne 0 ]; then
        return 1
    fi
    return 0
}

################################################################################
function main()
{
    get_purus
    if [ $? -ne 0 ]; then
        echo "Install python depend pkg  error."
        return 1
    fi

    pkg_install
    if [ $? -ne 0 ]; then
        echo "Install python depend pkg  error."
        return 1
    fi

    pip3 install -r reqirements.txt
    if [ $? -ne 0 ]; then
        echo "Install python module error."
        return 1
    fi
}
################################################################################
main "$@"
