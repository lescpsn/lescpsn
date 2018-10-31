#!/usr/bin/env bash

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
function config_ubuntu_source()
{
    sed -i "s/us.archive.ubuntu.com/mirrors.aliyun.com/g" /etc/apt/sources.list
    sed -i "s/security.ubuntu.com/mirrors.aliyun.com/g" /etc/apt/sources.list
    sed -i "s/^\( *deb  *cdrom\)/#\1/" /etc/apt/sources.list
    rm -rf /var/lib/apt/lists/*
    apt-get clean
    apt-get update
}

################################################################################
function install_devtools()
{
    apt-get -y install openssh-server
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install git
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install gcc
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install curl
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install vim
    if [[ $? -ne 0  ]]; then
	return 1
    fi
    
    apt-get -y install emacs
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install fish
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install ntpdate
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install aspell
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install ispell
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    apt-get -y install golang
    if [[ $? -ne 0  ]]; then
	return 1
    fi



}

################################################################################
function config_time()
{
    apt-get -y install ntpdate
    if [[ $? -ne 0  ]]; then
	return 1
    fi
    cp -rf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
    ntpdate 129.6.15.28 # time-a.nist.gov
    hwclock --systohc
}

################################################################################
function config_local()
{

    if [ ! -e /var/lib/locales/supported.d/local ]; then
	echo "en_US.UTF-8 UTF-8"  >>/var/lib/locales/supported.d/local
	echo "zh_CN.UTF-8 UTF-8"  >>/var/lib/locales/supported.d/local
    fi

    if grep "en_US.UTF-8 UTF-8" /var/lib/locales/supported.d/local; then
	:
    else
	echo "en_US.UTF-8 UTF-8"  >>/var/lib/locales/supported.d/local
    fi

    if grep "zh_CN.UTF-8 UTF-8" /var/lib/locales/supported.d/local; then
	:
    else
	echo "zh_CN.UTF-8 UTF-8"  >>/var/lib/locales/supported.d/local
    fi

    if grep  '^ *LANG *= *.*' /etc/default/locale  1>/dev/null 2>&1; then
	sed -i "s/LANG *= *.*/LANG="zh_CN.UTF-8"/" /etc/default/locale
    else
	echo 'LANG="zh_CN.UTF-8"'  >>/etc/default/locale
    fi

    if grep  '^ *LANGUAGE *= *.*' /etc/default/locale 1>/dev/null 2>&1; then
	sed -i "s/LANGUAGE *= *.*/LANGUAGE="zh_CN:"/" /etc/default/locale
    else
	echo 'LANGUAGE="zh_CN:"'  >>/etc/default/locale
    fi

    locale-gen 
}

################################################################################
function main()
{
    is_root
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    config_ubuntu_source
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    install_devtools
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    config_time
    if [[ $? -ne 0  ]]; then
	return 1
    fi

    config_local
    if [[ $? -ne 0  ]]; then
	return 1
    fi
    
}

################################################################################
main "$@"
