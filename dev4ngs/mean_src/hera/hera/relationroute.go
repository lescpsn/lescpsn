package hera

import (
	"git.ngs.tech/mean/hera/libgo"
	dream "git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/context"
)

func WrapRelationRoutes(g *gin.RouterGroup) {
	GetAllUserAllRelationHandler(g)
}

// 获取用户所有好友，粉丝，被关注的相关信息
func GetAllUserAllRelationHandler(g *gin.RouterGroup) {
	hf := func(c *gin.Context) {
		offsetHead, _ := libgo.StoI64(c.Query("offsetHead"))
		offsetTail, _ := libgo.StoI64(c.Query("offsetTail"))

		seqenceMethod, _ := libgo.StoI64(c.Query("seqenceMethod"))
		rsp, errors := Cl.GetAllUserAllRelation(context.TODO(), &dream.AllUserAllRelationRequest{
			OffsetHead:    offsetHead,
			OffsetTail:    offsetTail,
			SeqenceMethod: seqenceMethod,
		})
		if errors != nil {
			panic(errors)
		}
		c.JSON(GenericsSuccessCode, rsp)
	}
	g.GET(GetAllUserAllRelationRoute, hf)
}
