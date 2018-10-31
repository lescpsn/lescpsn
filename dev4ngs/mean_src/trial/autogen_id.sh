#!/usr/bin/env bash

API_CONFIG_FILE="api.toml"
function main()
{

    if [ ! -e ${API_CONFIG_FILE} ]; then
        echo "not exist"
        return 1
    fi

    num=10000
    i=1
    while read line
    do

        if echo $line | grep "^ *id *=" 1>/dev/null 2>&1; then
            echo "********:$i:$num :sed -i "${i}s/\(^ *id *=\).*/\1 \"$num\"/" ${API_CONFIG_FILE}"
            #echo "$line"
            sed -i "${i}s/\(^ *id *=\).*/\1 \"$num\"/" ${API_CONFIG_FILE}
            #sed -i "${i}s/\(^ *id *=\).*/\1 $num/" ${API_CONFIG_FILE}
            num=`expr $num + 1`
        fi

        i=`expr $i + 1`
    done<${API_CONFIG_FILE}
}

################################################################################
main "$@"
