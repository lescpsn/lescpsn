// This file "operationRoute" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
	"strings"
)

func WrapOperationRoutes(g *gin.RouterGroup) {
	getOperationListHandler(g)
	addOperationHandler(g)
	getOperationByIdHandler(g)
	upateOperationHandler(g)
	deleteOperationsHandler(g)
}

//getOperationListHandler method : get operation list form db
func getOperationListHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		err, result := bt.GetOperationList()
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.GET(GetOperationListRoute, h)
}

//addOperationHandler method : add a operation to db
func addOperationHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		var operation dream.Operation
		bt := c.MustGet(ControllerKey).(*BaseController)
		if err := c.Bind(&operation); err != nil {
			panic(err)
		}
		err, result := bt.AddOperation(&operation)
		if err != nil {
			panic(err)
		}
		c.JSON(200, result)
	}
	g.POST(AddOperationRoute, h)

}

//getOperationByIdHandler method : get a operation by Id
func getOperationByIdHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		resultModel := ResultModel{}
		uuid := c.Param("UUIDString")

		if len(uuid) == 0 {

			resultModel.PhoenixDefault = OperationUUIDRequire

		} else {
			operation, err := bt.GetOperationByID(uuid)

			if err != nil {
				resultModel.PhoenixDefault = OperationGetFailure
			} else {
				resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
				resultModel.Data = operation
			}

		}

		c.JSON(200, resultModel)
	}
	g.GET(GetOperationByIDRoute, h)
}

//upateOperationHandler  method : update a operation by Id
func upateOperationHandler(g *gin.RouterGroup) {

	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var operation dream.Operation
		resultModel := ResultModel{}
		if err := c.Bind(&operation); err != nil {

			resultModel.PhoenixDefault = &PhoenixDefault{Message: err.Error()}

		}
		result, err := bt.UpateOperation(&operation)
		if err != nil {
			resultModel.PhoenixDefault = OperationUpdateFailure

		} else {
			resultModel.PhoenixDefault = &PhoenixDefault{ErrorCode: 0}
			resultModel.Data = result
		}

		c.JSON(200, resultModel)
	}
	g.PUT(UpdateOperationRoute, h)
}

//deleteOperationsHandler  method : delete operations by id array
func deleteOperationsHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		var resultModel ResultModel
		var idstr []string
		idstr = strings.Split(c.Param("IDS"), ",")

		if len(idstr) == 0 {
			resultModel.PhoenixDefault = OperationIdsRequire

		} else {
			err := bt.DeleteOperations(idstr)

			if err != nil {
				resultModel.PhoenixDefault = OperationDeleteFailure
			} else {
				resultModel.ErrorCode = 0
			}
		}

		c.JSON(200, resultModel)
	}
	g.DELETE(DeleteOperationRoute, h)
}
