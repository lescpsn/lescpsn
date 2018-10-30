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
function install_devtools()
{
  apt-get -y install emacs
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
}

################################################################################
main "$@"
