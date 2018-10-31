package huston

import (
	"github.com/gin-gonic/gin"
)

func WrapFeedbackRoutes(g *gin.RouterGroup) {
	PostFeedbackHandle(g)
}

type PostFeedback struct {
	Suggestion  string `form:"suggestion_text" json:"suggestion_text" binding:"required"`
	Type int `form:"type" json:"type"`
}

// PostFeedbackHandle feedback接受端口
func PostFeedbackHandle(g *gin.RouterGroup) {
	Endpoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		var postFeedback PostFeedback
		if err := c.BindJSON(&postFeedback); err != nil {
			panic(RequestParamsErr)
		}
		feedback, err := m.PostFeedback(m.User, postFeedback.Suggestion, postFeedback.Type)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, feedback)

	}
	g.POST(FeedbackRoute, Endpoint)
}
