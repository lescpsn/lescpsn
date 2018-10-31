// This file "adminroute" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
	"github.com/gpmgo/gopm/modules/log"
	"strconv"
	"strings"
)

func WrapAdminRoutes(g *gin.RouterGroup) {
	InitDataToDBHandler(g)
	NewAdminHandler(g)
	GetAdminByNameHandler(g)
	GetAdminListHandler(g)
	GetAdminByUUIDHandler(g)
	UpateAdminHandler(g)
	DeleteAdminsHandler(g)
	SetRolesHandler(g)
	GetRolesHandler(g)
	CreateSchemaHandler(g)
}

// CreateSchemaHandler: 初始化数据库表结构
func CreateSchemaHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {

		bt := c.MustGet(ControllerKey).(*BaseController)
		err := bt.CreateSchema()
		resultModel := ResultModel{}
		log.Print("***********t101:")
		log.DEBUG
		if err != nil {
			resultModel.PhoenixDefault = AdminInit
		} else {
			resultModel.Data = "init data was successfully!"
		}
		c.JSON(200, resultModel)

		c.Writer.WriteHeader(204)

	}
	g.GET(CreateSchemaRoute, h)
}

// InitDataToDBHandler method : 初始化数据到数据库
func InitDataToDBHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		err := bt.InitDataToDB()
		resultModel := ResultModel{}
		if err != nil {
			resultModel.PhoenixDefault = AdminInit
		} else {
			resultModel.Data = "init data was successfully222!"
		}
		c.JSON(200, resultModel)
	}
	g.GET(InitDataToDBRoute, h)
}

// NewAdminHandler method: 新建管理员
func NewAdminHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		var admin dream.Admin
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		if err := c.Bind(&admin); err != nil {
			resultModel.PhoenixDefault = NewError(err)

		} else {
			result, err := bt.NewAdmin(&admin)
			if err != nil {
				resultModel.PhoenixDefault = NewError(err)
			} else {
				resultModel.Data = result
			}
		}

		c.JSON(200, resultModel)
	}
	g.POST(AddAdminRoute, h)
}

// GetAdminByNameHandler method : Get Admin By Name Handler
func GetAdminByNameHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		name := c.Param("Name")
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		result, err := bt.GetAdminByName(name)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.GET(GetAdminByNameRoute, h)
}

// GetAdminListHandler method : get Admin list form db
func GetAdminListHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		result, err := bt.GetAdminList()
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.GET(GetAdminListRoute, h)
}

//GetAdminByUUIDHandler method : get a Admin by UUID
func GetAdminByUUIDHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		uuid := c.Param("UUIDString")

		if len(uuid) == 0 {

			resultModel.PhoenixDefault = AdminUUIDRequire

		} else {
			admin, err := bt.GetAdminByUUID(uuid)

			if err != nil {
				resultModel.PhoenixDefault = NewError(err)
			} else {

				resultModel.Data = admin
			}

		}

		c.JSON(200, resultModel)
	}
	g.GET(GetAdminByUUIDRoute, h)
}

//UpateAdminHandler  method : update a admin by Id
func UpateAdminHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var admin dream.Admin
		resultModel := ResultModel{}
		if err := c.Bind(&admin); err != nil {

			resultModel.PhoenixDefault = NewError(err)

		}
		result, err := bt.UpdateAdmin(&admin)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)

		} else {
			resultModel.Data = result
		}

		c.JSON(200, resultModel)
	}
	g.PUT(UpdateAdminRoute, h)
}

//DeleteAdminsHandler  method : delete admin by id array
func DeleteAdminsHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		var idstr []string
		idstr = strings.Split(c.Param("IDS"), ",")

		if len(idstr) == 0 {
			resultModel.PhoenixDefault = AdminIdsRequire

		} else {
			err := bt.DeleteAdminByIDs(idstr)

			if err != nil {
				resultModel.PhoenixDefault = NewError(err)
			} else {
				resultModel.Data = true
			}
		}

		c.JSON(200, resultModel)
	}
	g.DELETE(DeleteAdminsRoute, h)
}

//SetRolesHandler method : set Admin roles
func SetRolesHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		admID := c.Param("AdminID")
		idstr := strings.Split(c.Param("RoleIDS"), ",")
		resultModel := ResultModel{}
		result, err := bt.SetRoles(admID, idstr)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			resultModel.Data = result
		}
		c.JSON(200, resultModel)
	}
	g.PUT(SetRolesForAdminRoute, h)
}

//GetRolesHandler method : Get Admin roles
func GetRolesHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		admID := c.Param("AdminID")
		resultModel := ResultModel{}
		id, err := strconv.ParseInt(admID, 10, 64)
		if err != nil {
			resultModel.PhoenixDefault = NewError(err)
		} else {
			result, err := bt.GetRolesByAdminID(id)
			if err != nil {
				resultModel.PhoenixDefault = NewError(err)

			} else {
				resultModel.Data = result
			}
			c.JSON(200, resultModel)
		}
	}
	g.GET(GetRolesByAdminIDRoute, h)
}
