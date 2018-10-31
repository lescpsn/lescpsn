// This file "user.go" is created by Lincan Li at 11/15/2015
// Copyright Negative Space Tech LLC. All rights reserved.

// Package models provides data model definition in Tuso project
package huston

import (
	"git.ngs.tech/mean/houston/model"
	"git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"strconv"
	"time"
)

func WrapDiaryRoutes(g *gin.RouterGroup) {
	NewDiaryHandler(g)
	UpdateDiaryByIDHandler(g)
	PatchDiaryByIDHandler(g)
	PatchDiaryPrivacyByIDHandler(g)
	DeleteDiaryByIDHandler(g)
	DeleteDiaryByUUIDHandler(g)
	FindDiaryByUserIDHandler(g)
	FindDiaryByUserUUIDHandler(g)
	FindAllDiaryByUserIDHandler(g)
	FindAllDiaryByUserUUIDHandler(g)
	GetDiaryByIDHandler(g)
	GetDiaryByIDsHandler(g)
	GetDiaryByUUIDHandler(g)
	GetDiaryByUUIDsHandler(g)
}

type DiaryModel struct {
	ID           int64
	UUID         string
	CreatedAt    string             `json:"created_at"`
	UserUUID     string             `json:"user_uuid"`
	DiaryPrivacy proto.DiaryPrivacy `json:"diary_privacy"`
	DiaryStatus  proto.DiaryStatus  `json:"diary_status"`
	Title        string
	Content      string
	Style        string
	Timestamp    *time.Time
}

func (d *DiaryModel) DiaryModel2Diary() *proto.Diary {

	dy := proto.Diary{}
	dy.UserUUID = d.UserUUID
	dy.DiaryPrivacy = d.DiaryPrivacy

	dy.Title = proto.String(d.Title)
	dy.Content = proto.String(d.Content)
	dy.Style = proto.String(d.Style)

	dy.DiaryStatus = d.DiaryStatus
	if d.Timestamp != nil {
		dy.Timestamp = d.Timestamp.Format(time.RFC3339)
	}

	return &dy

}

// NewDiaryHandler 方法: 创建日记
func NewDiaryHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		var d DiaryModel
		if err := c.Bind(&d); err != nil {
			panic(RequestParamsErr)
		}
		time := time.Now()
		d.Timestamp = &time
		result, err := m.NewDiary(d.DiaryModel2Diary())
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.POST(NewDiaryRoute, ReachabilityEndPoint)
}

// UpdateDiaryByIDHandler 方法: 根据id更新日记
func UpdateDiaryByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}
		var d DiaryModel
		if err := c.Bind(&d); err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.UpdateDiaryByID(id, d.DiaryModel2Diary())
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.PUT(UpdateDiaryByIDRoute, ReachabilityEndPoint)
}

// PatchDiaryByIDHandler 方法: 根据id更新日记的部分信息
func PatchDiaryByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}

		var d DiaryModel
		if err := c.Bind(&d); err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.PatchDiaryByID(id, d.DiaryModel2Diary())
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.PUT(PatchDiaryByIDRoute, ReachabilityEndPoint)
}

// PatchDiaryPrivacyByIDHandler 方法: 根据id更新日记的隐私状态
func PatchDiaryPrivacyByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		diaryPrivacy := c.Param("DiaryPrivacy")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}
		priv, err := model.Str2DiaryPrivacy(diaryPrivacy)

		if err != nil {
			panic(err)
		}
		d := proto.Diary{
			DiaryPrivacy: priv,
		}

		result, err := m.PatchDiaryByID(id, &d)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.PUT(PatchDiaryPrivacyByIDRoute, ReachabilityEndPoint)
}

// DeleteDiaryByIDHandler 方法: 根据id删除日记
func DeleteDiaryByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}
		result, err := m.DeleteDiaryByID(id)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.DELETE(DeleteDiaryByIDRoute, ReachabilityEndPoint)
}

// DeleteDiaryByUUIDHandler 方法: 根据uuid删除日记
func DeleteDiaryByUUIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUID := c.Param("UUID")

		if UUID == "" {
			panic(RequestParamsErr)
		}
		result, err := m.DeleteDiaryByUUID(UUID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.DELETE(DeleteDiaryByUUIDRoute, ReachabilityEndPoint)
}

// FindDiaryByUserIDHandler 方法: 根据用户id获取分页的日记列表
func FindDiaryByUserIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}
		qp, err := ParseQueryParameter(c)

		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.FindDiaryByUserID(id, qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindDiaryByUserIDRoute, ReachabilityEndPoint)
}

// FindDiaryByUserUUIDHandler 方法:  根据用户uuid获取分页的日记列表
func FindDiaryByUserUUIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUID := c.Param("UUID")
		if UUID == "" {
			panic(RequestParamsErr)
		}
		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.FindDiaryByUserUUID(UUID, qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindDiaryByUserUUIDRoute, ReachabilityEndPoint)
}

// FindAllDiaryByUserIDHandler 方法: 根据用户id获取所有日记列表
func FindAllDiaryByUserIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}
		result, err := m.FindAllDiaryByUserID(id)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindAllDiaryByUserIDRoute, ReachabilityEndPoint)
}

// FindAllDiaryByUserUUIDHandler 方法:  根据用户uuid获取所有日记列表
func FindAllDiaryByUserUUIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUID := c.Param("UUID")
		if UUID == "" {
			panic(RequestParamsErr)
		}
		result, err := m.FindAllDiaryByUserUUID(UUID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindAllDiaryByUserUUIDRoute, ReachabilityEndPoint)
}

// GetDiaryByIDHandler 方法: 根据日记id获取日记信息
func GetDiaryByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		ID := c.Param("ID")
		id, err := strconv.ParseInt(ID, 10, 64)
		if err != nil {
			panic(err)
		}

		result, err := m.GetDiaryByID(id)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetDiaryByIDRoute, ReachabilityEndPoint)
}

// GetDiaryByIDsHandler 方法: 根据日记的id数组获取多条日记信息
func GetDiaryByIDsHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		idsInt := []int64{}
		err := c.Bind(&idsInt)

		if err != nil {
			panic(RequestParamsErr)
		}

		if len(idsInt) == 0 {
			panic(RequestParamsErr)
		}
		result, err := m.GetDiaryByIDs(idsInt)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.POST(GetDiaryByIDsRoute, ReachabilityEndPoint)
}

// GetDiaryByUUIDHandler 方法: 根据日记的uuid获取日记信息
func GetDiaryByUUIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUID := c.Param("UUID")
		if UUID == "" {
			panic(RequestParamsErr)
		}

		result, err := m.GetDiaryByUUID(UUID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetDiaryByUUIDRoute, ReachabilityEndPoint)
}

// GetDiaryByUUIDsHandler 方法: 根据日记的uuid数组获取日记信息
func GetDiaryByUUIDsHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		uuids := []string{}
		err := c.Bind(&uuids)
		if err != nil {
			panic(RequestParamsErr)
		}

		if len(uuids) == 0 {
			panic(RequestParamsErr)
		}

		result, err := m.GetDiaryByUUIDs(uuids)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.POST(GetDiaryByUUIDsRoute, ReachabilityEndPoint)
}
