// This file "service.go" is created by Lincan Li at 6/22/16.
// Copyright © 2016 - Lincan Li. All rights reserved
package service

import (
	acfg "git.ngs.tech/mean/athena/config"
	"git.ngs.tech/mean/athena/echo"
	"git.ngs.tech/mean/athena/model"
	. "git.ngs.tech/mean/proto"
	"github.com/micro/go-micro"
	"github.com/micro/go-micro/cmd"
	"github.com/micro/go-micro/registry"
	"github.com/micro/go-micro/registry/consul"
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
	PACKAGE_NAME      = "service"
	HTTP_SERVICE_NAME = "tech-ngs-athena-http"
	RPC_SERVICE_NAME  = "tech-ngs-athena"
	SERVICE_VERSION   = "1.0"
)

const (
	CONSUL_ADDRESSES_KEY = "CONSUL_ADDRS"
)

var (
	m *acfg.MongoConfig
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

func GetMongoConf() *acfg.MongoConfig {
	if m == nil {
		m = LoadMongoConf()
	}
	return m
}

func LoadMongoConf() *acfg.MongoConfig {

	return &acfg.MongoConfig{
		Address:  Conf_GetValue(MGO_ADDRESSES),
		Port:     Conf_GetValue(MGO_PORT),
		Username: Conf_GetValue(MGO_USERNAME),
		Password: Conf_GetValue(MGO_PASSWORD),
	}
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

func App(port string) micro.Service {
	if tracer == nil {
		log.Fatal("[Loading] Tracer must be inited before init tracer")
	}

	srv := server.NewServer(
		server.Address(port),
		server.Name(RPC_SERVICE_NAME),
	)

	service := micro.NewService(
		micro.Registry(reg),
		micro.Server(srv),
		micro.RegisterInterval(time.Second*5),
		micro.Name(RPC_SERVICE_NAME),
		micro.Version(SERVICE_VERSION),
		micro.WrapHandler(MDBHandler),
		//micro.WrapHandler(trace.HandlerWrapper(tracer, &registry.Service{Name: RPC_SERVICE_NAME})),
	)
	RegisterAthenaServicesHandler(service.Server(), new(echo.Athena))
	return service
}

func MDBHandler(fn server.HandlerFunc) server.HandlerFunc {
	return func(ctx context.Context, req server.Request, rsp interface{}) error {
		log.Printf("[MDBHandler] Before serving request method: %v", req.Method())
		log.Printf("[MDBHandler - ] Starting DB ")
		_, mdb := model.GetMDBAndMSession(GetMongoConf())
		db_ctx := context.WithValue(ctx, echo.MDB_CONTEXT, mdb)
		err := fn(db_ctx, req, rsp)
		db_ctx.Done()
		log.Printf("[RDBHandler - ] ############################")
		return err
	}
}
