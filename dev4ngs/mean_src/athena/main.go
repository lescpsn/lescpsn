package main

import (
	"git.ngs.tech/mean/athena/config"
	"git.ngs.tech/mean/athena/service"
	"git.ngs.tech/mean/athena/wand"
	log "github.com/Sirupsen/logrus"
	"github.com/micro/go-web"
)

func main() {
	w := wand.Wand{}
	config.GetConfig("athena-config.ini")
	w.Config = config.GetAthenaConf()
	wand.InitDreamClient()
	service.InitConfig()
	service.InitTracer()
	wEngine := w.Engine()
	srv := web.NewService( //创建http的服务
		web.Name(service.HTTP_SERVICE_NAME),
		web.Address(w.Config.Port),
		web.Handler(wEngine),
	)
	go service.App(":9999").Run()
	log.Fatal("HTTP start fail ", srv.Run())

}
