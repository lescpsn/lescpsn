#!/usr/bin/env bash

if [ "$(ps -p "$$" -o comm=)" != "bash" ]; then
    # Taken from http://unix-linux.questionfor.info/q_unix-linux-programming_85038.html
    bash "$0" "$@"
    exit "$?"
fi

source ~/.profile

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

go build -o houston

exit 0