// This file "main" is created by Lincan Li at 1/7/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"flag"
	"git.ngs.tech/mean/hans/config"
	log "github.com/Sirupsen/logrus"
	"os"
	"git.ngs.tech/mean/hans/controller"
	"git.ngs.tech/mean/hans/route"
	"git.ngs.tech/mean/hans/service"
	"github.com/micro/go-web"
)

func init() {
	// Log as JSON instead of the default ASCII formatter.
	log.SetFormatter(&log.JSONFormatter{})

	// Output to stderr instead of stdout, could also be a file.
	log.SetOutput(os.Stderr)

	// Only log the warning severity or above.
	log.SetLevel(log.WarnLevel)
}

func main() {
	configPtr := flag.String("c", "mean-config.ini", "input config file address")
	flag.Parse()

	config.LoadConfig(*configPtr)

	m := route.Mean{
		Config: config.GetHansConf(),
	}

	controller.InitDreamClient()

	//m.MicroInit(m.Config.Port) //微服务注册

	mEngine := m.Engine()

	srv := web.NewService( //创建http的服务
		web.Name(service.HTTP_SERVICE_NAME),
		web.Address(m.Config.Port),
		web.Handler(mEngine),
	)

	log.Fatal("HTTP start fail ", srv.Run())
}
