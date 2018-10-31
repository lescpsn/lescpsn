package wand

import (
	"github.com/gin-gonic/gin"
	"github.com/satori/go.uuid"
	"log"
	"time"
)

func WrapNewsRoutes(g *gin.RouterGroup) {
	NewNewsHandler(g)
	GetUserNewsHandler(g)
	GetNewHandler(g)
	ForwardNewsHandler(g)
	DeleteNewsHandler(g)
	StarNewsHandler(g)
	UnStarNewsHandler(g)
	FindNewsStarHandler(g)
	GetSingleNewsHandler(g)
}

type CreateNews struct {
	PhotoUUIDsString []string  `form:"uuids" json:"uuids" binding:"required"`
	Timestamp        time.Time `form:"timestamp" json:"timestamp" binding:"required"`
}

func NewNewsHandler(g *gin.RouterGroup) {
	NewNewsEndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)
		var news CreateNews
		if err := c.BindJSON(&news); err != nil {
			panic(RequestParamsErr)
		}
		var photoUUIDs []uuid.UUID
		for _, UUIDString := range news.PhotoUUIDsString {
			UUID := uuid.FromStringOrNil(UUIDString)
			if UUID == uuid.Nil {
				panic(RequestParamsErr)
			}
			photoUUIDs = append(photoUUIDs, UUID)
		}
		result, err := m.NewNews(m.User, photoUUIDs, news.Timestamp)
		if err != nil {
			log.Println("create error", err.Error())
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(NewNewsRoute, NewNewsEndPoint)
}

func GetUserNewsHandler(g *gin.RouterGroup) {
	GetUserNewsEndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)
		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}
		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.GetUserNews(m.User, UUID, qp)

		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetUserNewsRoute, GetUserNewsEndPoint)
}

//GetSingleNewsHandler 获取单条图说
func GetSingleNewsHandler(g *gin.RouterGroup) {
	GetSingleNewsEndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)
		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}
		result, err := m.GetSingleNews(m.User, UUID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetSingleNewsRoute, GetSingleNewsEndPoint)
}

//GetNewHandler 获取自己的图说feed
func GetNewHandler(g *gin.RouterGroup) {
	EndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)
		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.GetFeeds(m.User, qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetNewsRoute, EndPoint)
}

//TODO
func ForwardNewsHandler(g *gin.RouterGroup) {
	ForwardNewsEndPoint := func(c *gin.Context) {

		c.JSON(GenericsSuccessCode, nil)
	}

	g.PUT(ForwardNewsRoute, ForwardNewsEndPoint)
}

//StarNewsHandler 给某个图说点赞
func StarNewsHandler(g *gin.RouterGroup) {
	StarNewsEndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}
		result, err := m.NewsStars(m.User, UUID)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.PUT(NewsStarRoute, StarNewsEndPoint)
}

//UnStarNewsHandler 取消摸个图说的赞
func UnStarNewsHandler(g *gin.RouterGroup) {
	UnStarNewsEndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		result, err := m.NewsUnStar(m.User, UUID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}

	g.PUT(NewsUnStarRoute, UnStarNewsEndPoint)
}

//FindNewsStarHandler 查看某图的赞列表
func FindNewsStarHandler(g *gin.RouterGroup) {
	FindNewsStarEndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.FindNewsStar(m.User, UUID, qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(QueryNewsStarRoute, FindNewsStarEndPoint)
}

func DeleteNewsHandler(g *gin.RouterGroup) {
	EndPoint := func(c *gin.Context) {
		m := c.MustGet(AthenaControllerKey).(*AthenaController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		d, err := m.DeleteNews(m.User, UUID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, d)
	}
	g.DELETE(DeleteNewsRoute, EndPoint)
}

type NewsComment struct {
	ReplyTo   string    `form:"reply_to" json:"reply_to"`
	Content   string    `form:"content" json:"content" binding:"required"`
	Timestamp time.Time `form:"timestamp" json:"timestamp" binding:"required"`
}

//func CommentOnNewsHandler(g *gin.RouterGroup) {
//	NewsCommentEndPoint := func(c *gin.Context) {
//		m := c.MustGet(AthenaControllerKey).(*AthenaController)
//
//		tUUID := c.Param("UUIDString")
//
//		var nc NewsComment
//		if err := c.BindJSON(&nc); err != nil {
//			panic(RequestParamsErr)
//		}
//
//		result, err := m.NewsNewsComment(m.User, tUUID, nc.ReplyTo, nc.Content, nc.Timestamp)
//		if err != nil {
//			panic(err)
//		}
//
//		c.JSON(GenericsSuccessCode, result)
//	}
//
//	g.POST(CommentOnNewsRoute, NewsCommentEndPoint)
//}

//func GetNewsCommentHandler(g *gin.RouterGroup) {
//	GetNewsCommentEndPoint := func(c *gin.Context) {
//		m := c.MustGet(AthenaControllerKey).(*AthenaController)
//
//		UUIDString := c.Param("UUIDString")
//		iUUID := uuid.FromStringOrNil(UUIDString)
//		if iUUID == uuid.Nil {
//			panic(RequestParamsErr)
//		}
//
//		qp, err := ParseQueryParameter(c)
//		if err != nil {
//			panic(RequestParamsErr)
//		}
//
//		result, err := m.FindNewsComments(m.User, iUUID, qp)
//		if err != nil {
//			panic(err)
//		}
//
//		c.JSON(GenericsSuccessCode, result)
//	}
//
//	g.GET(GetNewsCommentRoute, GetNewsCommentEndPoint)
//}
//
//func DeleteNewsCommentHandler(g *gin.RouterGroup) {
//	DeleteNewsCommentEndPoint := func(c *gin.Context) {
//		m := c.MustGet(AthenaControllerKey).(*AthenaController)
//
//		tUUID := c.Param("UUIDString")
//
//		cUUID := c.Param("CUUIDString")
//
//		result, err := m.NewsDeleteComment(m.User, tUUID, cUUID)
//		if err != nil {
//			panic(err)
//		}
//
//		c.JSON(GenericsSuccessCode, result)
//	}
//
//	g.DELETE(DeleteNewsCommentRoute, DeleteNewsCommentEndPoint)
//}

