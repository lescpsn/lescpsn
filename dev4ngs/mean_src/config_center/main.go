// This file "main.go" is created by Lincan Li at 6/27/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	config "github.com/micro/config-srv/proto/config"
	"github.com/micro/config-web/handler"
	"github.com/micro/go-micro/client"
	"github.com/micro/go-micro/registry"
	"github.com/micro/go-micro/registry/consul"
	"github.com/micro/go-web"
	"log"
	"os"
)

const (
	CONSUL_ADDRESSES_KEY = "CONSUL_ADDRS"
	META_ADDRESS_KEY     = "META_ADDRS"
)

func main() {
	mData, err := GetMetaData(os.Getenv(META_ADDRESS_KEY))
	if err != nil {
		log.Fatal("[Fatal] Get Meta Data Fail! ", err)
	}
	reg := consul.NewRegistry(
		registry.Addrs(os.Getenv(CONSUL_ADDRESSES_KEY)),
	)

	registry.DefaultRegistry = reg

	service := web.NewService(
		web.Advertise(mData.Address+":8080"),
		web.Address(":8080"),
		web.Name("ngs.tech.web.config"),
		web.Handler(handler.Router()),
	)

	service.Init()

	c := client.NewClient(
		client.Registry(reg),
	)

	handler.Init(
		"templates",
		config.NewConfigClient("ngs.tech.web.config", c),
	)

	log.Fatal("Start Config Center service fail: ", service.Run())
}
