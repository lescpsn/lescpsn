// This file "main.go" is created by Lincan Li at 6/22/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"git.ngs.tech/mean/sms/service"
	"log"
)

func main() {
	service.Init()
	service.InitConfig()
	service.InitTracer()

	app := service.App()

	log.Fatal("Start SMS service fail: ", app.Run())
}
