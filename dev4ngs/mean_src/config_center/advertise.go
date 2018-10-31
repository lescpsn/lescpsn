// This file "advertise.go" is created by Lincan Li at 6/27/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"github.com/levigross/grequests"
)

type Meta struct {
	Default string `json:"default"`
	Address string `json:"address"`
	Port    string `json:"port"`
}

func GetMetaData(cAddr string) (*Meta, error) {
	rsp, err := grequests.Get("http://"+cAddr, nil)
	if err != nil || !rsp.Ok {
		return nil, err
	}

	var mData Meta
	if err := rsp.JSON(&mData); err != nil {
		return nil, err
	}

	return &mData, nil
}
