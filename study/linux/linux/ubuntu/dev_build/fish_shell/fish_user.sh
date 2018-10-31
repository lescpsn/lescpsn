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
function install_oh_my_fish()
{
    rm -rf ~/.local/share/omf
    curl -L github.com/oh-my-fish/oh-my-fish/raw/master/bin/install | fish 
}

################################################################################
function config_oh_my_fish()
{
    cp ~/.config/fish/config.fish  ~/.config/fish/config.fish.$$
    cp config.fish ~/.config/fish/config.fish
}

################################################################################
function main()
{
    is_notroot
    if [[ $? -ne 0  ]]; then
        return 1
    fi

    install_oh_my_fish
    if [[ $? -ne 0  ]]; then
        return 1
    fi
}

################################################################################
main "$@"
