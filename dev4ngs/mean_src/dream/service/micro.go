// This file "micro.go" is created by Lincan Li at 6/15/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package service

import (
	"git.ngs.tech/mean/dream/echo"
	"git.ngs.tech/mean/dream/mars"
	"github.com/jinzhu/gorm"
	"github.com/micro/go-micro"
	"github.com/micro/go-micro/cmd"
	"github.com/micro/go-micro/registry"
	//"github.com/micro/go-micro/registry/consul"
	. "git.ngs.tech/mean/proto"
	fRegistry "github.com/llcan1120/fast-registry"
	"github.com/micro/go-micro/broker"
	"github.com/micro/go-micro/server"
	"github.com/micro/go-platform/config"
	config_consul "github.com/micro/go-platform/config/source/consul"
	"github.com/micro/go-platform/trace"
	"github.com/micro/go-platform/trace/zipkin"
	"golang.org/x/net/context"
	"log"
	"os"
	"time"
)

const (
	PACKAGE_NAME    = "service"
	SERVICE_NAME    = "tech-ngs-dream"
	SERVICE_VERSION = "1.0"
)

const (
	CONSUL_ADDRESSES_KEY = "CONSUL_ADDRS"
	META_ADDRESS_KEY     = "META_ADDRS"
)

func Init() {
	log.Println("[Log] Consule address is ", os.Getenv(CONSUL_ADDRESSES_KEY))

	reg = fRegistry.NewRegistry(
		fRegistry.Addrs(os.Getenv(CONSUL_ADDRESSES_KEY)),
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
	//	//log.Fatal("[Fatal] Get Meta Data Fail! ", err)
	//}

	b := broker.NewBroker(
		broker.Addrs(":10011"),
	)

	srv := server.NewServer(
		server.Name(SERVICE_NAME),
		server.Address(":10010"),
		//server.Advertise(mData.Address + ":10010"),
		server.Broker(b),
	)

	service := micro.NewService(
		micro.Server(srv),
		micro.Registry(reg),
		micro.Name(SERVICE_NAME),
		micro.Version(SERVICE_VERSION),
		//micro.WrapHandler(trace.HandlerWrapper(tracer, &registry.Service{Name: SERVICE_NAME})),
		micro.WrapHandler(RDBHandler),
	)

	mars.SetRDBAddress(Conf_GetValue(RDB_ADDRESSES))
	mars.SetRDBPort(Conf_GetValue(RDB_PORT))
	mars.SetRDBName(Conf_GetValue(RDB_DB_NAME))
	mars.SetRDBUsername(Conf_GetValue(RDB_USERNAME))
	mars.SetRDBPassword(Conf_GetValue(RDB_PASSWORD))
	mars.SetRDBSSLMode(Conf_GetValue(RDB_SSL_MODE))

	RegisterDreamServicesHandler(service.Server(), new(echo.Dream))

	return service
}

const RDB_CONTEXT = "RDB_CTX"

func RDBHandler(fn server.HandlerFunc) server.HandlerFunc {
	return func(ctx context.Context, req server.Request, rsp interface{}) error {
		log.Printf("[RDBHandler] Before serving request method: %v", req.Method())
		log.Printf("[RDBHandler - ] Starting DB ")

		db_ctx := context.WithValue(ctx, RDB_CONTEXT, mars.GetTransaction())

		err := fn(db_ctx, req, rsp)

		db := db_ctx.Value(RDB_CONTEXT).(*gorm.DB)

		if err != nil {
			log.Printf("[RDBHandler] Rolling back database")
			mars.RollbackRDB(db)
		} else {
			mars.CommitRDB(db)
		}
		db_ctx.Done()

		log.Printf("[RDBHandler - ] ############################")
		return err
	}
}
