// This file "main" is created by Lincan Li at 1/7/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"flag"
	"git.ngs.tech/mean/houston/config"
	"git.ngs.tech/mean/houston/huston"
	"git.ngs.tech/mean/houston/service"
	log "github.com/Sirupsen/logrus"
	"github.com/micro/go-web"
	"os"
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

	m := huston.Mean{
		Config: config.GetHusConf(),
	}

	huston.InitDreamClient()

	//m.MicroInit(m.Config.Port) //微服务注册

	mEngine := m.Engine()
	srv := web.NewService( //创建http的服务
		web.Name(service.HTTP_SERVICE_NAME),
		web.Address(m.Config.Port),
		web.Handler(mEngine),
	)

	srv.Run()

	//log.Fatal("HTTP start fail ", mEngine.Run(m.Config.Port))

}
