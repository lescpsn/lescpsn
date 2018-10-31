#!/usr/bin/env bash

if [ "$(ps -p "$$" -o comm=)" != "bash" ]; then
    # Taken from http://unix-linux.questionfor.info/q_unix-linux-programming_85038.html
    bash "$0" "$@"
    exit "$?"
fi

source ~/.profile

NGSGOPATH="$GOPATH/src/git.ngs.tech/mean"
DREAMGOPATH="$NGSGOPATH/dream"

cd "$DREAMGOPATH"

GOLANGGOPATH="$GOPATH/src/golang.org/x"

GetGoDepsIfNecessary () {
    PACKPATH="$GOLANGGOPATH/$1"

    if [ ! -d "$PACKPATH" ]; then
        mkdir -p "$GOLANGGOPATH"
        URL="https://github.com/golang/$1.git"

        echo ""
        echo "-> Directory not found $PACKPATH, Cloning from $URL"

        git clone "$URL"
        mv "$1" "$GOLANGGOPATH"
#        go install "$1"

        rm -rf "$1"
    fi
}

GetGoDepsIfNecessary net
GetGoDepsIfNecessary sys
GetGoDepsIfNecessary tools
GetGoDepsIfNecessary crypto

command_exists () {
    type "$1" &> /dev/null ;
}

if ! command_exists godep ; then
    echo "user defined: godep command not found"
    go get -u github.com/tools/godep
fi


if ! godep restore -v ; then
    echo "==================================================="
    echo "Some dependencies fetching fail, please be advised!"
    echo "==================================================="
fi

go build -o dream

exit 0