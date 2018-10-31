package route

import (
	"git.ngs.tech/mean/hans/config"
	dream "git.ngs.tech/mean/proto"
	"github.com/brandfolder/gin-gorelic"
	"github.com/gin-gonic/gin"
	"strconv"
)

const (
	GroupRouteBodyError   = `/vbr`
	GroupRouteVersion1Key = `/v1`
)

type MeanErrorHandleType int

const (
	MeanErrorHandleTypeHeader MeanErrorHandleType = 1 + iota
	MeanErrorHandelTypeBody
)

const (
	MeanControllerKey  = "MeanControllerKey"
	MeanErrorHandelKey = "MeanReturnErrInBodyKey"
)

const (
	GenericsSuccessCode = 200
	GenericsErrorCode   = 400
)

//Search
const (
	SearchUserByKeywords     = `search/user/:Keywords`     // GET   搜索用户
	SearchFollowerByKeywords = `search/follower/:Keywords` // GET  搜索粉丝
	SearchFolloweeByKeywords = `search/followee/:Keywords` // GET   搜索关注

)

type Mean struct {
	Config *config.HansConfig
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

	br := m.Route.Group(GroupRouteBodyError)
	{
		br.Use(BodyErrorHandler())
	}

	v1 := m.Route.Group(GroupRouteVersion1Key)
	{
		v1.Use(AuthorizationHandler())
		WrapAccountRoutes(v1)
	}

	return m.Route
}

func SToI(s string) (int, error) {
	if s == "" {
		return 0, nil
	}

	a, err := strconv.Atoi(s)
	return a, err
}

func SToB(s string) (bool, error) {
	if s == "true" {
		return true, nil
	}

	return false, nil
}

func SToI64(s string) (int64, error) {
	if s == "" {
		return 0, nil
	}
	a, err := strconv.ParseInt(s, 10, 64)
	return a, err
}

func ParseQueryParameter(c *gin.Context) (*dream.QueryParameter, error) {
	SinceIDString := c.Query("since_id")
	SinceID, err := SToI(SinceIDString)
	if err != nil {
		return nil, err
	}
	MaxIDString := c.Query("max_id")
	MaxID, err := SToI(MaxIDString)
	if err != nil {
		return nil, err
	}
	PageString := c.Query("page")
	Page, err := SToI(PageString)
	if err != nil {
		return nil, err
	}
	CountString := c.Query("count")
	Count, err := SToI(CountString)
	if err != nil {
		return nil, err
	}
	AllString := c.Query("all")
	All, err := SToB(AllString)
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
