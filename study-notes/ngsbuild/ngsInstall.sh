#!/usr/bin/env bash
. ./lib.sh

# config infor begin
# after wirte in config file
GOPATH="/home/carhj/goprojects"
DREAM_GIT_URL="http://git.ngs.tech/scm/mean/dream.git"
HOUSTON_GIT_URL="http://git.ngs.tech/scm/mean/houston.git"
NGS_PRO_DIR="${GOPATH}/src/git.ngs.tech/mean"
LOCALBIN_DIR="/usr/local/bin"
# config infor end

################################################################################
function build_goproject()
{
    mkdir -p ${GOPATH}/bin
    if [ $? -ne 0 ]; then
        return 1
    fi

    mkdir -p ${GOPATH}/pkg
    if [ $? -ne 0 ]; then
        return 1
    fi

    mkdir -p ${GOPATH}/src
    if [ $? -ne 0 ]; then
        return 1
    fi

    mkdir -p ${HOUSTON_PRO_DIR}

    if grep "set -x GOPATH ${GOPATH}"  ~/.config/fish/config.fish; then
        :
    else
        echo "set -x GOPATH ${GOPATH}" >>~/.config/fish/config.fish
    fi


    if cat ~/.config/fish/config.fish | grep "set -x PATH" | grep "${GOPATH}/bin"; then
        :
    else
        echo "set -x PATH PATH ${GOPATH}/bin"  >>~/.config/fish/config.fish
    fi

    if cat ~/.config/fish/config.fish | grep "set -x PATH" | grep "${GOPATH}/bin"; then
        :
    else
        echo "set -x PATH \$PATH \$GOPATH/bin"  >>~/.config/fish/config.fish
    fi

    return 0
}

################################################################################
function install_dream()
{
    git clone ${DREAM_GIT_URL} ${NGS_PRO_DIR}/dream
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
function install_houston()
{
    git clone ${HOUSTON_GIT_URL} ${NGS_PRO_DIR}/houston
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
function del_houston()
{
    rm -rf ${GOPATH}/*
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
function install_gotools()
{

    # install godep
    echo "Starting install godep..."
    command_exist godep
    if [ $? -ne 0 ];then
        go get -u github.com/tools/godep
        if [ $? -ne 0 ]; then
            echo "Installing godep failed."
            return 1
        fi
        cp -rf ${GOPATH}/bin/godep  ${LOCALBIN_DIR}/
    fi
    echo "Installing godep finished."


    # install godef
    echo "Starting install godef..."
    command_exist godef
    if [ $? -ne 0 ];then
        go get github.com/rogpeppe/godef
        if [ $? -ne 0 ]; then
            echo "Installing godef failed."
            return 1
        fi
        cp -rf ${GOPATH}/bin/godef  ${LOCALBIN_DIR}/
    fi
    echo "Installing godef finished."

    # install gocode
    echo "Starting install gocode..."
    command_exist gocode
    if [ $? -ne 0 ];then
        go get github.com/nsf/gocode
        if [ $? -ne 0 ]; then
            echo "Installing gocode failed."
            return 1
        fi
        cp -rf ${GOPATH}/bin/gocode  ${LOCALBIN_DIR}/

    fi
    echo "Installing gocode finished."
}


################################################################################
function main()
{


    flag=$1
    if [ "X${flag}" == X"-d" ]; then
        echo "Starting delete go project from ${GOPATH}..."
        del_houston
        return 0
    fi

    install_gotools
    if [ $? -ne 0 ]; then
        echo "Installing go tools failed."
        return 1
    fi

    echo "Starting build go project..."
    build_goproject
    if [ $? -ne 0 ]; then
        echo "Building go project failed."
        return 1
    fi
    echo "Building go project finished."

    install_dream
    if [ $? -ne 0 ]; then
        echo "Giting go project from ${DREAM_GIT_URL} failed."
        return 1
    fi
    echo "Giting go project from ${DREAM_GIT_URL} finished."

    echo "Starting git go project from ${HOUSTON_GIT_URL}..."
    install_houston
    if [ $? -ne 0 ]; then
        echo "Giting go project from ${HOUSTON_GIT_URL} failed."
        return 1
    fi
    echo "Giting go project from ${HOUSTON_GIT_URL} finished."


}
################################################################################
main "$@"
