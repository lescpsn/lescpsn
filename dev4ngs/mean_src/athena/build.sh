#!/bin/bash

function main()
{
    go build -o athena
    #scp -i ~/sshkey/kp-2t5jofua hera-config.ini root@124.42.118.124:~/hera/
    ssh -i ~/sshkey/kp-2t5jofua root@124.42.118.124 "killall athena"
    scp -i ~/sshkey/kp-2t5jofua athena root@124.42.118.124:~/8081
    ssh -i ~/sshkey/kp-2t5jofua root@124.42.118.124 "cd ~/8081; ./athena 1>/tmp/athena.log  2>&1 &"
}
################################################################################
main "$@"



