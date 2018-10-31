#!/usr/bin/env bash

VIRTUALENV_NAME=py2run
PYTHON_BIN=/usr/bin/python2

function main()
{
    # install pip3
    currentuser=`id -un`
    if [ "X${currentuser}" == "Xroot" ]; then
        apt-get install -y python-pip python3-pip 
    else
        sudo apt-get install -y python-pip python3-pip
    fi
    if [ $? -ne 0 ]; then
        echo "Install  python-pip and python3-pip error."
        return 1
    fi

    # install virtualenv
    if [ "X${currentuser}" == "Xroot" ]; then
        apt-get install -y virtualenv
    else
        sudo apt-get install -y virtualenv
    fi

    if [ $? -ne 0 ]; then
        echo "Install virtualenv error."
        return 1
    fi

    # create virtualenv
    virtualenv --distribute --no-site-packages --python=${PYTHON_BIN} ~/${VIRTUALENV_NAME}

    # config virtualenv
    if [ `basename "$SHELL"` == "fish" ]; then
        if grep "^ *source.*activate.fish" ~/.config/fish/config.fish 1>/dev/null 2>&1; then
            :
        else
            echo "source ~/${VIRTUALENV_NAME}/bin/activate.fish"  >>~/.config/fish/config.fish
        fi

    elif [ `basename "$SHELL"` == "bash" ]; then
        if grep "^ *source.*activate" ~/.bashrc 1>/dev/null 2>&1; then
            :
        else
            echo "source ~/${VIRTUALENV_NAME}/bin/activate"  >>~/.bashrc
        fi
    fi
}
################################################################################
main "$@"
