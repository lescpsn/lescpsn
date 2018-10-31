#!/usr/bin/env fish

    set CURDIR (pwd)
    set OLDGOPATH {$GOPATH}
    set  GOPATH $CURDIR
    gofmt -w src
    go install test
    echo "#########:$SHELL:$GOPATH"
    set  GOPATH $OLDGOPATH
    echo "#########:$SHELL:$GOPATH"
