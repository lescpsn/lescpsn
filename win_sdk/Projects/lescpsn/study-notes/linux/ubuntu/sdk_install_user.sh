#!/usr/bin/env bash

################################################################################
function config_emacs()
{
    rm -rf ~/.emacs.d/
    curl -L https://git.io/epre | sh
    cp prelude-packages.el  ~/.emacs.d/core/prelude-packages.el
    cp prelude-modules.el  ~/.emacs.d/
    cp my@prelude.el ~/.emacs.d/personal/
}

################################################################################
function main()
{

    config_emacs
    if [ $? -ne 0 ]; then
	return 1
    fi
}

################################################################################
main "$@"
