#!/usr/bin/env bash
MADEIRA_DIR=~/qxdevelop/madeira
MADEIRA_URL=https://git.quxun.io/core/madeira.git

################################################################################
function get_madeira()
{
    if [ -e ${MADEIRA_DIR} ]; then
        rm -rf ${MADEIRA_DIR}
    fi

    git clone ${MADEIRA_URL} ${MADEIRA_DIR}
    if [ $? -ne 0 ]; then
        return 1
    fi

    cp -rf *.yaml ${MADEIRA_DIR}/
    cp -r area_v4.bin ${MADEIRA_DIR}/
    mkdir -p ${MADEIRA_DIR}/logs/
    return 0
}


################################################################################
function main()
{
    get_madeira
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
main "$@"
