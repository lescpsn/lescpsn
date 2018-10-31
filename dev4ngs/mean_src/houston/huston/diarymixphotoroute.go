// This file "diarymixphotoroute.go" is created by hengjun che at 2016/06/15
// Copyright Nanjing Negative Space Tech LLC. All rights reserved.
// Package models provides data model definition in Tuso project
package huston

import (
	"github.com/gin-gonic/gin"
	"gopkg.in/mgo.v2"
	"strconv"
)

func WrapDiaryMixPhotoRoutes(g *gin.RouterGroup) {
	GetDiaryMixPhotoByUserUUIDHandler(g)
	//InsertDiaryMixPhotoHandler(g)
	//ListDiaryMixPhotoHandler(g)
}

// DiarymixphotoCollectionName 方法, 返回 Collection 字段
func DiarymixphotoCollectionName() string {
	return "diary_mix_photo"
}

// DiarymixphotoCollection 方法, 返回 Collection
func DiarymixphotoCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(DiarymixphotoCollectionName())
}

// GetDiaryMixPhotoByUserIDHandler 方法: 根据用户id获取日记和图片混排信息
func GetDiaryMixPhotoByUserUUIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		usrID := c.Param("UUID")
		SinceIDString := c.Query("since_id")
		CountString := c.DefaultQuery("count", "20")
		Count, err := SToI(CountString)
		if err != nil {
			panic(err)
		}
		refreshString := c.DefaultQuery("drop_refresh", "true")
		refresh, err := strconv.ParseBool(refreshString)
		if err != nil {
			panic(err)
		}
		result, err := m.GetDiaryMixPhotoByUserUUID(usrID, SinceIDString, Count, refresh)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetDiaryMixPhotoByUserUUIDRoute, ReachabilityEndPoint)
}
