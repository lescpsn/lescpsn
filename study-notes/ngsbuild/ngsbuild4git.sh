#!/usr/bin/env bash

# config infor begin
# after wirte in config file
DREAM_GIT_URL="http://git.ngs.tech/scm/mean/dream.git"
HOUSTON_GIT_URL="http://git.ngs.tech/scm/mean/houston.git"
BUILD_DIR="/home/carhj/Build"
# config infor end

################################################################################
function usage()
{
    echo -e "\033[31mUsage: ngsbuild4git.sh [-a|-d|-h]\033[0m"
    echo -e "-a: buil dream and houston"
    echo -e "-d: buil dream only"
    echo -e "-h: buil houston only"
}


################################################################################
function confirm_config()
{
    echo -e "Dream Git Url\033[32m[$DREAM_GIT_URL]\033[0m"
    echo -e "Houston Git Url\033[32m[$HOUSTON_GIT_URL]\033[0m"
    echo -e "Your Build Dir\033[32m[$BUILD_DIR]\033[0m"
}

################################################################################
function build_dream()
{
    if [ -e ${BUILD_DIR}/dream ]; then
        cd ${BUILD_DIR}/dream
        git pull 1>/dev/null 2>&1
    else
        git clone ${HOUSTON_GIT_URL} ${BUILD_DIR}/dream  1>/dev/null 2>&1
    fi

    if [ $? -ne 0 ]; then
        return 1
    fi

    cd ${BUILD_DIR}/dream
    go build
    if [ $? -ne 0 ]; then
        return 1
    fi
}

################################################################################
function build_houston()
{
    if [ -e ${BUILD_DIR}/houston ]; then
        cd ${BUILD_DIR}/houston
        git pull 1>/dev/null 2>&1
    else
        git clone ${HOUSTON_GIT_URL} ${BUILD_DIR}/houston  1>/dev/null 2>&1
    fi

    if [ $? -ne 0 ]; then
        return 1
    fi

    cd ${BUILD_DIR}/houston
    go build
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
    if [ $# -ne 1 ]; then
        usage
        return 1
    fi
    confirm_config
    return 1
    echo -e "\033[32m[INFO]\033[0mStarting git go project from ${DREAM_GIT_URL}..."
    build_dream
    if [ $? -ne 0 ]; then
        echo -e "\033[31m[ERROR]\033[0mGiting go project from ${DREAM_GIT_URL} failed."
        return 1
    fi
    echo -e "\033[32m[INFO]\033[0mGiting go project from ${DREAM_GIT_URL} finished."

    echo -e "\033[32m[INFO]\033[0mStarting git go project from ${HOUSTON_GIT_URL}..."
    build_houston
    if [ $? -ne 0 ]; then
        echo -e "\033[31m[ERROR]\033[0mGiting go project from ${HOUSTON_GIT_URL} failed."
        return 1
    fi
    echo -e "\033[32m[INFO]\033[0mGiting go project from ${HOUSTON_GIT_URL} finished."

}
################################################################################
main "$@"
