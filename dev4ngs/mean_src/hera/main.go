// This file "main" is created by Lincan Li at 1/7/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"flag"
	"git.ngs.tech/mean/hera/config"
	"git.ngs.tech/mean/hera/hera"
	"git.ngs.tech/mean/hera/service"
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
	configPtr := flag.String("c", "hera-config.ini", "input config file address")
	flag.Parse()
	config.LoadConfig(*configPtr)
	m := hera.Mean{
		Config: config.GetHusConf(),
	}
	hera.InitDreamClient()
	hera.InitAthenaClient()
	mEngine := m.Engine()

	srv := web.NewService( //创建http的服务
		web.Name(service.HTTP_SERVICE_NAME),
		web.Address(m.Config.Port),
		web.Handler(mEngine),
	)

	log.Fatal("HTTP start fail ", srv.Run())
}


