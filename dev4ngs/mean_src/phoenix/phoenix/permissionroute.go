// This file "permissionRoute" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
	"strconv"
	"strings"
)

func WrapPermissionRoutes(g *gin.RouterGroup) {
	getPermissionListHandler(g)
	addPermissionHandler(g)
	getPermissionByIdHandler(g)
	upatePermissionHandler(g)
	deletePermissionsHandler(g)
}

//getPermissionListHandler method : get permission list form db
func getPermissionListHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		err, result := bt.GetPermissionList()
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.GET(GetPermissionListRoute, h)
}

//addPermissionHandler method : add a permission to db
func addPermissionHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		var permission dream.Permission
		bt := c.MustGet(ControllerKey).(*BaseController)
		if err := c.Bind(&permission); err != nil {
			panic(err)
		}
		err, result := bt.AddPermission(&permission)
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.POST(AddPermissionRoute, h)

}

//getPermissionByIdHandler method : get a permission by Id
func getPermissionByIdHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		uuid := c.Param("UUIDString")

		if len(uuid) == 0 {

			resultModel.PhoenixDefault = PermissionUUIDRequire

		} else {
			permission, err := bt.GetPermissionById(uuid)

			if err != nil {
				resultModel.PhoenixDefault = PermissionGetFailure
			} else {
				resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
				resultModel.Data = permission
			}

		}

		c.JSON(200, resultModel)
	}
	g.GET(GetPermissionByIDRoute, h)
}

//upatePermissionHandler  method : update a permission by Id
func upatePermissionHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var permission dream.Permission
		resultModel := ResultModel{}
		if err := c.Bind(&permission); err != nil {

			resultModel.PhoenixDefault = &PhoenixDefault{Message: err.Error()}

		}
		result, err := bt.UpatePermission(&permission)
		if err != nil {
			resultModel.PhoenixDefault = PermissionUpdateFailure

		} else {
			resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
			resultModel.Data = result
		}

		c.JSON(200, resultModel)
	}
	g.PUT(UpdatePermissionRoute, h)
}

//deletePermissionsHandler  method : delete permissions by id array
func deletePermissionsHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var resultModel ResultModel
		var idstr []string
		idstr = strings.Split(c.Param("IDS"), ",")

		if len(idstr) == 0 {
			resultModel.PhoenixDefault = PermissionIdsRequire

		} else {
			err := bt.DeletePermissions(idstr)

			if err != nil {
				resultModel.PhoenixDefault = PermissionDeleteFailure
			} else {
				resultModel.ErrorCode = 0
			}
		}

		c.JSON(200, resultModel)
	}
	g.DELETE(DeletePermissionRoute, h)
}

//SetMenusForPermissionHandler method : set Permission menus
func SetMenusForPermissionHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		rID := c.Param("PermissionID")
		idstr := strings.Split(c.Param("MenuIDS"), ",")
		resultModel := ResultModel{}
		result, err := bt.SetMenuForPermisson(rID, idstr)

		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.PUT(SetMenusForPermissionRoute, h)
}

//GetMenusByPermissionIDHandler method : Get  role admins
func GetMenusByPermissionIDHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		roleID := c.Param("PermissionID")
		id, err := strconv.ParseInt(roleID, 10, 64)
		if err != nil {

			return
		}
		resultModel := ResultModel{}
		result, err := bt.GetMenusByPermissionID(id)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.GET(GetMenusByPermissionIDRoute, h)
}

//SetMenusForPermissionHandler method : set Permission menus
func SetOperationsForPermissionHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		rID := c.Param("PermissionID")
		idstr := strings.Split(c.Param("OperationIDS"), ",")
		resultModel := ResultModel{}
		result, err := bt.SetOperationForPermisson(rID, idstr)

		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.PUT(SetOperationsPermissionIDRoute, h)
}

//GetMenusByPermissionIDHandler method : Get  role admins
func GetOperationsByPermissionIDHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		roleID := c.Param("PermissionID")
		id, err := strconv.ParseInt(roleID, 10, 64)
		if err != nil {

			return
		}
		resultModel := ResultModel{}
		result, err := bt.GetOperationsByPermissionID(id)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.GET(GetOperationsByPermissionIDRoute, h)
}
