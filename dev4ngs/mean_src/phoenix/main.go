// This file "main" is created by Lincan Li at 1/7/16.
// Copyright © 2016 - Lincan Li. All rights reserved
package main

import (
	"flag"
	"fmt"
	"git.ngs.tech/mean/phoenix/config"
	"git.ngs.tech/mean/phoenix/phoenix"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type HTTPListenMode int

const (
	HTTPListenModeMultiDomain HTTPListenMode = 1 + iota
	HTTPListenModeMultiPort
	HTTPListenModeMultiUnknown
)

const (
	RouteUsage = "using r flag to indicate desired HTTP listen mode. " +
		"`domain` for multi domain mode `port` for multi port mode"
	ConfigUsage = "input config file address"
)

func StringToHTTPListenMode(a string) HTTPListenMode {
	if a == "domain" || a == "multi_domain" {
		return HTTPListenModeMultiDomain
	}

	if a == "port" || a == "multi_port" {
		return HTTPListenModeMultiPort
	}

	os.Exit(1)
	return HTTPListenModeMultiUnknown
}

type HostSwitch struct {
	Host    map[string]http.Handler
	Default http.Handler
}

func (hs HostSwitch) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	host := strings.Split(r.Host, ":")

	if handler := hs.Host[host[0]]; handler != nil {

		handler.ServeHTTP(w, r)
	} else {
		hs.Default.ServeHTTP(w, r)
	}
}
func main() {
	routePtr := flag.String("r", "port", RouteUsage)
	configPtr := flag.String("c", "phoenix-config.ini", ConfigUsage)
	flag.Parse()
	HTTPMode := StringToHTTPListenMode(*routePtr)

	config.LoadConfig(*configPtr)

	// jober := &message.MessageTask{}
	// go message.NewJobServer(jober)

	p := phoenix.Phoenix{
		Config: config.GetPhoConf(),
	}

	pEngine := p.Engine()

	if HTTPMode == HTTPListenModeMultiDomain {
		hs := make(map[string]http.Handler)
		hs[p.Config.Address] = pEngine

		h := &HostSwitch{
			Host:    hs,
			Default: pEngine,
		}

		log.Fatal("HTTPListenModeMultiDomain ", http.ListenAndServe(":8020", h))
	} else {
		// TODO, 使用更加合理的方式去监听多个端口
		go func() {
			s := &http.Server{
				//Addr:           p.Config.Port,
				Addr:           "127.0.0.1:9999",
				Handler:        pEngine,
				ReadTimeout:    10 * time.Second,
				WriteTimeout:   10 * time.Second,
				MaxHeaderBytes: 1 << 20,
			}

			log.Fatal("HTTPListenModeMultiPort1 ", s.ListenAndServe())
		}()
		fmt.Println("***********t101:2", p.Config.Port)
		log.Fatal("HTTPListenModeMultiPort2 ", http.ListenAndServe(p.Config.Port, pEngine))
	}
}
