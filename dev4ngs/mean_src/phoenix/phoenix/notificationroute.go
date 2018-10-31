// This file "error_message_route" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
)

func WrapErrMessageRoutes(g *gin.RouterGroup) {
	getMessageHandler(g)
	sendMessageHandler(g)
}

//获取信息列表
func getMessageHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		err, result := bt.getMessageList()
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.GET(GetMsgListRoute, h)
}

//发送消息
func sendMessageHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		var msg dream.Notification
		bt := c.MustGet(ControllerKey).(*BaseController)
		if err := c.Bind(&msg); err != nil {
			panic(err)
		}
		err, result := bt.sendMsg(&msg)
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.POST(SendMsgRoute, h)

}
