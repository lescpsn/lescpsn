package hera

import (
	"git.ngs.tech/mean/hera/libgo"
	"github.com/gin-gonic/gin"
)

func WrapTusoRoutes(g *gin.RouterGroup) {
	GetAllUserTusoHandler(g)
}

// 获取所有人的所有图说
func GetAllUserTusoHandler(g *gin.RouterGroup) {
	hf := func(c *gin.Context) {
		// 获取GET方式的参数
		offsetHead, err := libgo.StoI64(c.Query("offsetHead"))
		if err != nil {
			panic(err)
		}
		offsetTail, err := libgo.StoI64(c.Query("offsetTail"))

		if err != nil {
			panic(err)
		}

		startTime:= c.Query("startTime")
		endTime:= c.Query("endTime")

		m := c.MustGet(MeanControllerKey).(*HeraController)

		result, err := m.GetAllUserTuso(offsetHead, offsetTail,startTime,endTime)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)

	}
	g.GET(GetAllUserTusoRoute, hf)
}
