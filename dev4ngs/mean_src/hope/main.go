// This file "main" is created by Lincan Li at 1/7/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	//"git.ngs.tech/mean/hope/config"
	"git.ngs.tech/mean/hope/controller"
	"git.ngs.tech/mean/hope/route"
	"git.ngs.tech/mean/hope/service"
	log "github.com/Sirupsen/logrus"
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
	service.Init()
	c := service.InitConfig()
	t := service.InitTracer()
	m := route.Mean{}
	controller.InitDreamClient()
	srv := service.App(m.Engine(c, t))
	log.Fatal("HTTP start fail ", srv.Run())
}
