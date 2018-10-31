package hera

import (
	"git.ngs.tech/mean/hera/config"
	"git.ngs.tech/mean/hera/libgo"
	dream "git.ngs.tech/mean/proto"
	"github.com/brandfolder/gin-gorelic"
	"github.com/gin-gonic/gin"
)

type MeanErrorHandleType int

type Mean struct {
	Config *config.HustonConfig
	Route  *gin.Engine
}

func (m Mean) Engine() *gin.Engine {
	m.Route = gin.New()

	// Global middleware
	m.Route.Use(gin.Logger())
	m.Route.Use(LoggerWithWriter())
	m.Route.Use(gin.Recovery())

	// new relic monitor
	gorelic.InitNewrelicAgent("f243fdc54ca4b221bbabef85444e798a6d946335", "Huston", false)
	m.Route.Use(gorelic.Handler)

	m.Route.Use(InitHandler(m.Config))
	m.Route.Use(ErrorDBTransactionHandler())
	m.Route.Use(HeaderErrorHandler())

	v1 := m.Route.Group(GroupRouteVersion1Key)
	{
		//WrapAccountRoutes(v1)
		//v1.Use(AuthorizationHandler())
		//WrapImageRoutes(v1)
		//WrapUserRoutes(v1)
		//WrapDiaryRoutes(v1)
		//WrapFeedbackRoutes(v1)
		//WrapDiaryMixPhotoRoutes(v1)
		WrapSockpuppetRoutes(v1)
		WrapRelationRoutes(v1)
		WrapTusoRoutes(v1)
	}

	return m.Route
}

func ParseQueryParameter(c *gin.Context) (*dream.QueryParameter, error) {
	SinceIDString := c.Query("since_id")
	SinceID, err := libgo.StoI(SinceIDString)
	if err != nil {
		return nil, err
	}
	MaxIDString := c.Query("max_id")
	MaxID, err := libgo.StoI(MaxIDString)
	if err != nil {
		return nil, err
	}
	PageString := c.Query("page")
	Page, err := libgo.StoI(PageString)
	if err != nil {
		return nil, err
	}
	CountString := c.Query("count")
	Count, err := libgo.StoI(CountString)
	if err != nil {
		return nil, err
	}
	AllString := c.Query("all")
	All, err := libgo.StoB(AllString)
	if err != nil {
		return nil, err
	}
	qp := &dream.QueryParameter{
		SinceID: int32(SinceID),
		MaxID:   int32(MaxID),
		Page:    int32(Page),
		Count:   int32(Count),
		All:     All,
	}

	return qp, nil
}
