package route

import (
	. "git.ngs.tech/mean/daniel/utils"
	. "git.ngs.tech/mean/hans/controller"
	"github.com/gin-gonic/gin"
)

func WrapAccountRoutes(g *gin.RouterGroup) {
	SearchDataForUsersHandler(g)
	SearchDataForFolloweeHandler(g)
	SearchDataForFollowerHandler(g)
}

func SearchDataForUsersHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		PIndexStr := c.DefaultQuery("pindex", "0")
		PSizeStr := c.DefaultQuery("psize", "10")
		Keywords := c.Param("Keywords")

		PIndex, err := SToI(PIndexStr)
		if err != nil {
			panic(RequestParamsErr)
		}
		PSize, err := SToI(PSizeStr)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.SearchDataForUsers(Keywords, PIndex, PSize)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)

	}
	g.GET(SearchUserByKeywords, h)
}

func SearchDataForFolloweeHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		PIndexStr := c.DefaultQuery("pindex", "0")
		PSizeStr := c.DefaultQuery("psize", "10")
		Keywords := c.Param("Keywords")

		PIndex, err := SToI(PIndexStr)
		if err != nil {
			panic(RequestParamsErr)
		}
		PSize, err := SToI(PSizeStr)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.SearchDataForUsers(Keywords, PIndex, PSize)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)

	}
	g.GET(SearchFolloweeByKeywords, h)
}

func SearchDataForFollowerHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		PIndexStr := c.DefaultQuery("pindex", "0")
		PSizeStr := c.DefaultQuery("psize", "10")
		Keywords := c.Param("Keywords")

		PIndex, err := SToI(PIndexStr)
		if err != nil {
			panic(RequestParamsErr)
		}
		PSize, err := SToI(PSizeStr)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.SearchDataForUsers(Keywords, PIndex, PSize)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)

	}
	g.GET(SearchFollowerByKeywords, h)
}
