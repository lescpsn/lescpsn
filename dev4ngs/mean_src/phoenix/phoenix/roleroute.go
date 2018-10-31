// This file "roleRoute" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
	"strconv"
	"strings"
)

func WrapRoleRoutes(g *gin.RouterGroup) {
	GetRoleListHandler(g)
	AddRoleHandler(g)
	GetRoleByIdHandler(g)
	UpateRoleHandler(g)
	DeleteRolesHandler(g)
	SetAdminsForRoleHandler(g)
	GetAdminsByRoleIdHandler(g)
	SetPermissionsForRoleHandler(g)
	GetGetPermissionsByRoleIdHandler(g)
}

//AddRoleHandler method : add a role to db
func AddRoleHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		var role dream.Role
		bt := c.MustGet(ControllerKey).(*BaseController)
		if err := c.Bind(&role); err != nil {
			panic(err)
		}
		result, err := bt.AddRole(&role)
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.POST(AddRoleRoute, h)

}

//GetRoleListHandler method : get role list form db
func GetRoleListHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		result, err := bt.GetRoleList()
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.GET(GetRoleListRoute, h)
}

//DeleteRolesHandler  method : delete roles by id array
func DeleteRolesHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var resultModel ResultModel
		var idstr []string
		idstr = strings.Split(c.Param("IDS"), ",")

		if len(idstr) == 0 {
			resultModel.PhoenixDefault = RoleIdsRequire

		} else {
			err := bt.DeleteRoles(idstr)

			if err != nil {
				resultModel.PhoenixDefault = RoleDeleteFailure
			} else {
				resultModel.Data = true
			}
		}

		c.JSON(200, resultModel)
	}
	g.DELETE(DeleteRoleRoute, h)
}

//UpateRoleHandler  method : update a role by Id
func UpateRoleHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var role dream.Role
		resultModel := ResultModel{}
		if err := c.Bind(&role); err != nil {

			resultModel.PhoenixDefault = &PhoenixDefault{Message: err.Error()}

		}
		result, err := bt.UpdateRole(&role)
		if err != nil {
			resultModel.PhoenixDefault = RoleUpdateFailure

		} else {
			resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
			resultModel.Data = result
		}

		c.JSON(200, resultModel)
	}
	g.PUT(UpdateRoleRoute, h)
}

//GetRoleByIdHandler method : get a role by Id
func GetRoleByIdHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		id := c.Param("RoleID")

		if len(id) == 0 {

			resultModel.PhoenixDefault = RoleUUIDRequire

		} else {
			role, err := bt.GetRoleByID(id)

			if err != nil {
				resultModel.PhoenixDefault = RoleGetFailure
			} else {
				resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
				resultModel.Data = role
			}

		}

		c.JSON(200, resultModel)
	}
	g.GET(GetRoleByIDRoute, h)
}

//SetAdminsHandler method : set role admins
func SetAdminsForRoleHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		rID := c.Param("RoleID")
		idstr := strings.Split(c.Param("AdminIDS"), ",")
		resultModel := ResultModel{}
		result, err := bt.SetAdminsForRoel(rID, idstr)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.PUT(SetAdminsForRoleRoute, h)
}

//GetAdminsHandler method : Get  role admins
func GetAdminsByRoleIdHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		roleID := c.Param("RoleID")
		id, err := strconv.ParseInt(roleID, 10, 64)

		if err != nil {

			return
		}
		resultModel := ResultModel{}
		result, err := bt.GetAdminsByRoleId(id)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.GET(GetAdminsByRoleIDRoute, h)
}

//SetAdminsHandler method : set role admins
func SetPermissionsForRoleHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		rID := c.Param("RoleID")
		idstr := strings.Split(c.Param("PermissionIDS"), ",")
		resultModel := ResultModel{}
		result, err := bt.SetPermissionsForRole(rID, idstr)

		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.PUT(SetPermissionsForRoleRoute, h)
}

//GetAdminsHandler method : Get  role admins
func GetGetPermissionsByRoleIdHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		roleID := c.Param("RoleID")
		id, err := strconv.ParseInt(roleID, 10, 64)
		if err != nil {

			return
		}
		resultModel := ResultModel{}
		result, err := bt.GetPermissionsByRoleID(id)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.GET(GetPermissionsByRoleIDRoute, h)
}
