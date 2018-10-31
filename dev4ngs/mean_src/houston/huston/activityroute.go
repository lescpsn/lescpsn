package huston

import (
	"git.ngs.tech/mean/houston/model"
	"github.com/gin-gonic/gin"
	"qiniupkg.com/x/errors.v7"
)

func WrapActivityRoutes(g *gin.RouterGroup) {
	NewActivityHandler(g)
	GetActivityByIDHandler(g)
	FindActivity(g)
	DeleteActivityByIDHandler(g)
	UpdateActivityByIDHandler(g)

}

// NewActivityHandler 方法: 创建活动
func NewActivityHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		var d model.Activity
		if err := c.Bind(&d); err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.NewActivity(&d)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.POST(NewActivityRoute, ReachabilityEndPoint)
}

// GetActivityByIDHandler 方法: 根据id获取活动信息
func GetActivityByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.FirstActivityByID(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetActivityByIDRoute, ReachabilityEndPoint)
}

// FindActivity 方法: 查询分页信息
func FindActivity(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		SinceIDString := c.Query("since_id")
		MaxIDString := c.Query("max_id")
		CountString := c.DefaultQuery("count", "5")
		Count, err := SToI(CountString)
		if err != nil {
			panic(err)
		}

		if err != nil {
			panic(err)
		}
		result, err := m.FindActivity(SinceIDString, MaxIDString, Count)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindActivityRoute, ReachabilityEndPoint)
}

// DeleteActivityByIDHandler 方法: 根据id删除活动信息
func DeleteActivityByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.DeleteActivity(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, gin.H{"success": result})
	}
	g.DELETE(DeleteActivityByIDRoute, ReachabilityEndPoint)
}

// UpdateActivityByIDHandler 方法: 根据id修改活动信息
func UpdateActivityByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")

		if ID == "" {
			panic(errors.New("Activivty id is required ! pls try again!"))
		}

		var a model.Activity
		if err := c.Bind(&a); err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.UpdateActivity(ID, a)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, gin.H{"success": result})
	}
	g.PUT(UpdateActivityByIDRoute, ReachabilityEndPoint)
}
