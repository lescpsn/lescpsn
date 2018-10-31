package hera

import (
	athena "git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/context"
	"git.ngs.tech/mean/hera/libgo"
	"fmt"
)

func WrapTusoRoutes(g *gin.RouterGroup) {
	GetAllUserTusoHandler(g)
}

// 获取所有人的所有图说
func GetAllUserTusoHandler(g *gin.RouterGroup) {
	hf := func(c *gin.Context) {
		// 获取GET方式的参数
		offsetHead ,_:= libgo.StoI64(c.Query("offsetHead"))
		offsetTail ,_:= libgo.StoI64(c.Query("offsetTail"))
		fmt.Println("************offsetHead=",offsetHead)
		fmt.Println("************offsetTail=",offsetTail)
		result, _ := Cathena.GetAllUserNews(context.TODO(), &athena.AllUserNewsRequest{
			OffsetHead: offsetHead,
			OffsetTail: offsetTail,
		})
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetAllUserTusoRoute, hf)
}