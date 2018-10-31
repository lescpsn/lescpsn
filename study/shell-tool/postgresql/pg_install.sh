#!/usr/bin/env bash
. ../lib/lib.sh

################################################################################
function install_pg() {
    apt-get -y install postgresql 1>/dev/null 2>&1
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
function main() {
    is_root
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing user is not root."
        return 1
    fi

    print_log "INFO" "Start installing postgresql..."
    install_pg
    if [ $? -ne 0 ]; then
        print_log "ERRO" "Installing postgresql error."
        return 1
    fi
    print_log "INFO" "Installing postgresql finish."
}
################################################################################
main "$@"
