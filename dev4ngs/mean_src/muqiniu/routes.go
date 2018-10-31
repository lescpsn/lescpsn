// This file "routes.go" is created by Lincan Li at 5/13/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"github.com/gin-gonic/gin"
)

// account
const (
	UploadCallBack   = `/`     // POST
	PipelineCallback = `/pfop` // POST
)


func Engine() *gin.Engine {
	Route := gin.New()

	// Global middleware
	Route.Use(gin.Logger())
	Route.Use(gin.Recovery())

	UploadHandler(Route)
	PipelineHandler(Route)

	return Route
}
