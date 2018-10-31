#!/usr/bin/env bash

################################################################################
function is_notroot()
{
    typeset user=`whoami`
    if [[ "X$user" = "Xroot" ]]; then
        return 1
    fi
    return 0
}

################################################################################
function install_emacs()
{
    rm -rf ~/.emacs.d/
    curl -L https://git.io/epre | sh

    cp ~/.emacs.d/prelude-modules.el  ~/.emacs.d/prelude-modules.el.bak
    cp prelude-modules.el  ~/.emacs.d/

    cp ~/.emacs.d/core/prelude-packages.el ~/.emacs.d/core/prelude-packages.el.bak
    cp prelude-packages.el  ~/.emacs.d/core/prelude-packages.el

    cp my@prelude.el ~/.emacs.d/personal/
}

################################################################################
function config_emacs()
{

    typeset user=`whoami`
    typeset shell=`cat /etc/passwd | grep $user | awk -F[:] '{print $NF}'`
    if [[ `basename $shell` = "fish" ]]; then

        if grep "^ *set  *-x  *TERM  *xterm-256color"  ~/.config/fish/config.fish 1>dev/null 2>&1; then
            :
        else
            echo "set -x TERM xterm-256color"  >>~/.config/fish/config.fish
        fi
    fi
}

################################################################################
function main()
{
    is_notroot
    if [[ $? -ne 0  ]]; then
        return 1
    fi

    install_emacs
    if [[ $? -ne 0  ]]; then
        return 1
    fi
}

################################################################################
main "$@"
