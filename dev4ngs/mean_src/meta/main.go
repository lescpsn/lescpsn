// This file "main.go" is created by Lincan Li at 6/27/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"github.com/gin-gonic/gin"
	"net"
	"net/http"
)

func main() {
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		host, port := SplitHostPort(c.Request)

		c.JSON(200, gin.H{
			"uri": c.Request.RequestURI,
			"default": c.Request.RemoteAddr,
			"address": host,
			"port": port,
		})
	})
	r.Run(":8080")
}

func SplitHostPort(r *http.Request) (string, string) {
	ip := ""
	if ipProxy := r.Header.Get("X-FORWARDED-FOR"); len(ipProxy) > 0 {
		ip = ipProxy
	}

	ip, port, _ := net.SplitHostPort(r.RemoteAddr)
	return ip, port
}