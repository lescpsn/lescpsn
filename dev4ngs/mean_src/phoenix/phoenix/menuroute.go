// This file "menuRoute" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
	"strings"
)

func WrapMenuRoutes(g *gin.RouterGroup) {
	getMenuListHandler(g)
	addMenuHandler(g)
	getMenuTreeHandler(g)
	getMenuByIdHandler(g)
	upateMenuHandler(g)
	deleteMenusHandler(g)
}

//getMenuListHandler method : get menu list form db
func getMenuListHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		err, result := bt.GetMenuList()
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.GET(GetMenuListRoute, h)
}

//addMenuHandler method : add a menu to db
func addMenuHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		var menu dream.Menu
		bt := c.MustGet(ControllerKey).(*BaseController)
		if err := c.Bind(&menu); err != nil {
			panic(err)
		}
		err, result := bt.AddMenu(&menu)
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.POST(AddMenuRoute, h)

}

//getMenuTreeHandler method : get menu tree form db
func getMenuTreeHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		result := bt.GetMenuTree()
		c.JSON(200, result)
	}
	g.GET(GetMenuTreeRoute, h)
}

//getMenuByIdHandler method : get a menu by Id
func getMenuByIdHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		uuid := c.Param("UUIDString")

		if len(uuid) == 0 {

			resultModel.PhoenixDefault = MenuUUIDRequire

		} else {
			menu, err := bt.GetMenuById(uuid)

			if err != nil {
				resultModel.PhoenixDefault = MenuGetFailure
			} else {
				resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
				resultModel.Data = menu
			}

		}

		c.JSON(200, resultModel)
	}
	g.GET(GetMenuByIDRoute, h)
}

//upateMenuHandler  method : update a menu by Id
func upateMenuHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var menu dream.Menu
		resultModel := ResultModel{}
		if err := c.Bind(&menu); err != nil {

			resultModel.PhoenixDefault = &PhoenixDefault{Message: err.Error()}

		}
		result, err := bt.UpateMenu(&menu)
		if err != nil {
			resultModel.PhoenixDefault = MenuUpdateFailure

		} else {
			resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
			resultModel.Data = result
		}

		c.JSON(200, resultModel)
	}
	g.PUT(UpdateMenuRoute, h)
}

//deleteMenusHandler  method : delete menus by id array
func deleteMenusHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var resultModel ResultModel
		var idstr []string
		idstr = strings.Split(c.Param("IDS"), ",")

		if len(idstr) == 0 {
			resultModel.PhoenixDefault = MenuIdsRequire

		} else {
			err := bt.DeleteMenus(idstr)

			if err != nil {
				resultModel.PhoenixDefault = MenuDeleteFailure
			} else {
				resultModel.ErrorCode = 0
			}
		}

		c.JSON(200, resultModel)
	}
	g.DELETE(DeleteMenuRoute, h)
}
