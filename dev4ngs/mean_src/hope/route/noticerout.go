package route

import (
	. "git.ngs.tech/mean/hope/controller"
	"github.com/gin-gonic/gin"
)

func WrapNoticeRoutes(g *gin.RouterGroup) {
	GetNoticeByIDHandler(g)
	FindNotice(g)
	MarkNoticeReadHandler(g)
	DeleteNoticeByIDHandler(g)

}

// GetNoticeByIDHandler 方法: 根据动态id获取动态信息
func GetNoticeByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.FirstNoticeByUUID(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetNoticeByIDRoute, ReachabilityEndPoint)
}

// FindNotice 方法: 根据用户uuid,动态id,以及状态查询分页信息
func FindNotice(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		SinceIDString := c.Query("since_id")
		MaxIDString := c.Query("max_id")
		CountString := c.DefaultQuery("count", "100")
		Count, err := SToI(CountString)
		if err != nil {
			panic(err)
		}
		StatusString := c.Query("status")
		Status, err := SToI(StatusString)
		if err != nil {
			panic(err)
		}
		result, err := m.FindNotices(SinceIDString, MaxIDString, Status, Count)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindNoticeByUserUUIDRoute, ReachabilityEndPoint)
}

// FindNotice 方法: 根据用户uuid,动态id,以及状态查询分页信息
func FindMyNotice(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		SinceIDString := c.Query("since_id")
		MaxIDString := c.Query("max_id")
		CountString := c.DefaultQuery("count", "100")
		Count, err := SToI(CountString)
		if err != nil {
			panic(err)
		}
		StatusString := c.Query("status")
		Status, err := SToI(StatusString)
		if err != nil {
			panic(err)
		}
		result, err := m.FindMyNotices(SinceIDString, MaxIDString, Status, Count)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindMyNoticeByUserUUIDRoute, ReachabilityEndPoint)
}

// MarkNoticeReadHandler 方法: 根据id将消息更改为已读信息
func MarkNoticeReadHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.MarkNoticeRead(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, gin.H{"success": result})
	}
	g.PUT(UpdateNoticeByIDRoute, ReachabilityEndPoint)
}

// DeleteNoticeByIDHandler 方法: 根据id删除动态信息
func DeleteNoticeByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.DeletNotic(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, gin.H{"success": result})
	}
	g.DELETE(DeleteNoticeByIDRoute, ReachabilityEndPoint)
}
