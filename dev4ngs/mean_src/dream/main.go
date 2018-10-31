// This file "server.go" is created by Lincan Li at 5/5/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"git.ngs.tech/mean/dream/service"
	"log"
)

func main() {
	service.Init()
	service.InitConfig()
	service.InitTracer()

	app := service.App()

	log.Fatal("Start dream service fail: ", app.Run())
}
