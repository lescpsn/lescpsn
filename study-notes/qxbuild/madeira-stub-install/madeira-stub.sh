#!/usr/bin/env bash

MADEIRA_STUB_DIR=~/qxdevelop/madeira-stub
MADEIRA_STUB_URL="https://git.quxun.io/extra/madeira-stub.git"

################################################################################
function get_madeira_stub()
{
    if [ -e ${MADEIRA_STUB_DIR} ]; then
        rm -rf ${MADEIRA_STUB_DIR}
    fi

    git clone ${MADEIRA_STUB_URL} ${MADEIRA_STUB_DIR}
    if [ $? -ne 0 ]; then
        return 1
    fi

    cp -rf *.yaml ${MADEIRA_STUB_DIR}/
    cp -rf area_v3.bin ${MADEIRA_STUB_DIR}/
    cp -rf stub.py ${MADEIRA_STUB_DIR}/

    mkdir -p ${MADEIRA_STUB_DIR}/logs

    return 0
}

################################################################################
function main()
{
    get_madeira_stub
}
################################################################################
main "$@"
