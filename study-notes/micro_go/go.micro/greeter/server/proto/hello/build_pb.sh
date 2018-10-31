#!/usr/bin/env bash

function main()
{
    protoc --go_out=plugins=micro:. *.proto
}
################################################################################
main "$@"
