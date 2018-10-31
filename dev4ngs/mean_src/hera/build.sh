#!/bin/bash

function main()
{
    export GOOS=linux
    go build -o herax
    if [ $? -ne 0 ]; then
        return 1
    fi
    #scp -i ~/sshkey/kp-2t5jofua hera-config.ini root@124.42.118.124:~/hera/
    ssh -i ~/sshkey/kp-2t5jofua root@124.42.118.124 "killall herax"
    scp -i ~/sshkey/kp-2t5jofua herax root@124.42.118.124:~/hera/
    ssh -i ~/sshkey/kp-2t5jofua root@124.42.118.124 "cd ~/hera; ./herax 1>/tmp/hera.log  2>&1 &"
}
################################################################################
main "$@"
