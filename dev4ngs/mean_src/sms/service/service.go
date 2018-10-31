// This file "service.go" is created by Lincan Li at 6/22/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package service

import (
	"git.ngs.tech/mean/sms/echo"
	"git.ngs.tech/mean/sms/mars"
	. "git.ngs.tech/mean/sms/proto/sms"
	"github.com/micro/go-micro"
	"github.com/micro/go-micro/broker"
	"github.com/micro/go-micro/cmd"
	"github.com/micro/go-micro/registry"
	"github.com/micro/go-micro/registry/consul"
	"github.com/micro/go-micro/server"
	"github.com/micro/go-platform/config"
	config_consul "github.com/micro/go-platform/config/source/consul"
	"github.com/micro/go-platform/trace"
	"github.com/micro/go-platform/trace/zipkin"
	"log"
	"os"
	"time"
)

const (
	PACKAGE_NAME    = "service"
	SERVICE_NAME    = "tech-ngs-sms"
	SERVICE_VERSION = "1.0"
)

const (
	CONSUL_ADDRESSES_KEY = "CONSUL_ADDRS"
	META_ADDRESS_KEY     = "META_ADDRS"
)

func Init() {
	log.Println("[Log] Consule address is ", os.Getenv(CONSUL_ADDRESSES_KEY))

	reg = consul.NewRegistry(
		registry.Addrs(os.Getenv(CONSUL_ADDRESSES_KEY)),
	)

	cmd.Init(
		cmd.Registry(&reg),
	)
}

var (
	reg    registry.Registry
	conf   config.Config
	tracer trace.Trace
)

func InitConfig() config.Config {
	conf = config.NewConfig(
		config.PollInterval(time.Second*10),
		config.WithSource(config_consul.NewSource(config.SourceHosts(os.Getenv(CONSUL_ADDRESSES_KEY)))),
	)
	return conf
}

func InitTracer() trace.Trace {
	if conf == nil {
		log.Fatal("[Loading] Config must be inited before init tracer")
	}

	tracer = zipkin.NewTrace(
		trace.Collectors(Conf_GetValue(ZIPKIN_ADDRESS)),
	)
	return tracer
}

func App() micro.Service {
	if tracer == nil {
		log.Fatal("[Loading] Tracer must be inited before init tracer")
	}

	// Hotfix for docker ip problem
	//mData, err := GetMetaData(os.Getenv(META_ADDRESS_KEY))
	//if err != nil {
	//	log.Fatal("[Fatal] Get Meta Data Fail! ", err)
	//}

	b := broker.NewBroker(
		broker.Addrs(":10001"),
	)

	srv := server.NewServer(
		server.Name(SERVICE_NAME),
		server.Address(":10000"),
		//server.Advertise(mData.Address + ":10000"),
		server.Broker(b),
	)

	service := micro.NewService(
		micro.Server(srv),
		micro.Registry(reg),
		micro.Name(SERVICE_NAME),
		micro.Version(SERVICE_VERSION),
		micro.WrapHandler(trace.HandlerWrapper(tracer, &registry.Service{Name: SERVICE_NAME})),
	)

	mars.SetMGOUserName(Conf_GetValue(MGO_USERNAME))
	mars.SetMGOPassword(Conf_GetValue(MGO_PASSWORD))
	mars.SetMGOAddress(Conf_GetValue(MGO_ADDRESSES))
	mars.SetMGOPort(Conf_GetValue(MGO_PORT))
	mars.SetMGODatabase(Conf_GetValue(MGO_DATABASE))

	RegisterSMSServicesHandler(service.Server(), new(echo.SMS))

	return service
}