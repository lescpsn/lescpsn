#!/usr/bin/env bash

GOPATH=~/Projects/golang
DREAM_SRC=http://Hengjun%20Che@bitbucket.ngs.tech/scm/mean/dream.git
DREAM_OBJ=$GOPATH/src/git.ngs.tech/mean/dream

HOUSTON_SRC=http://Hengjun%20Che@bitbucket.ngs.tech/scm/mean/houston.git
HOUSTON_OBJ=$GOPATH/src/git.ngs.tech/mean/houston

ATHENA_SRC=http://Hengjun%20Che@bitbucket.ngs.tech/scm/mean/athena.git
ATHENA_OBJ=$GOPATH/src/git.ngs.tech/mean/athena

HERA_SRC=http://Hengjun%20Che@bitbucket.ngs.tech/scm/mean/hera.git
HERA_OBJ=$GOPATH/src/git.ngs.tech/mean/hera

PROTO_SRC=http://Hengjun%20Che@bitbucket.ngs.tech/scm/mean/proto.git
PROTO_OBJ=$GOPATH/src/git.ngs.tech/mean/proto


GOOGLE_SRC=github.com/golang
GOOGLE_OBJ=$GOPATH/src/golang.org



################################################################################
function create_goworkdir()
{
    if [[ ! -e $GOPATH/src ]]; then
        mkdir -p $GOPATH/src
    fi

    if [[ ! -e $GOPATH/pkg ]]; then
        mkdir -p $GOPATH/pkg
    fi

    if [[ ! -e $GOPATH/bin ]]; then
        mkdir -p $GOPATH/bin
    fi
}

################################################################################
function get_ngs_src()
{
    if [[ ! -e $GOPATH/src/git.ngs.tech ]]; then
        mkdir -p $GOPATH/src/git.ngs.tech/mean
    fi

    if [[ ! -e $ATHENA_OBJ ]]; then
        git clone $ATHENA_SRC $ATHENA_OBJ
    fi


    if [[ ! -e $DREAM_OBJ ]]; then
        git clone $DREAM_SRC $DREAM_OBJ
    fi

    if [[ ! -e $HERA_OBJ ]]; then
        git clone $HERA_SRC $HERA_OBJ
    fi

    if [[ ! -e $HOUSTON_OBJ ]]; then
        git clone $HOUSTON_SRC $HOUSTON_OBJ
    fi

    if [[ ! -e $PROTO_OBJ ]]; then
        git clone $PROTO_SRC $PROTO_OBJ
    fi


    rm -rf $GOOGLE_OBJ
    mkdir -p  $GOOGLE_OBJ
    go get -u $GOOGLE_SRC/net
    ln -s $GOPATH/src/$GOOGLE_SRC $GOOGLE_OBJ/x
}

################################################################################
function main()
{
    create_goworkdir
    if [[ $? -ne 0 ]]; then
        return 1
    fi

    get_ngs_src
    if [[ $? -ne 0 ]]; then
        return 1
    fi
}

################################################################################
main "$@"
