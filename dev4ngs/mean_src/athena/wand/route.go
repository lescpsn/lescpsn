package wand

import (
	"git.ngs.tech/mean/athena/config"
	. "git.ngs.tech/mean/proto"
	"github.com/brandfolder/gin-gorelic"
	"github.com/gin-gonic/gin"
	"github.com/micro/go-micro/broker"
	"strconv"
)

const (
	AthenaControllerKey = "AthenaControllerKey"
	//AthenaErrorHandelKey = "AthenaReturnErrInBodyKey"
)

const GroupRouteVersion1Key = "v1"

const (
	GenericsSuccessCode = 200
	GenericsErrorCode   = 400
)

// Tuso
const (
	GetUserNewsRoute       = `user/:UUIDString/tusos`                // GET
	GetNewsRoute           = `tusos/tuso`                            // GET
	NewNewsRoute           = `tuso/`                                 // POST
	DeleteNewsRoute        = `tuso/:UUIDString`                      // DELETE
	GetSingleNewsRoute     = `tuso/:UUIDString`                      // GET
	ForwardNewsRoute       = `tuso/:UUIDString/forward`              // PUT
	NewsStarRoute          = `tuso/:UUIDString/star`                 // PUT
	NewsUnStarRoute        = `tuso/:UUIDString/unstar`               // PUT
	QueryNewsStarRoute     = `tuso/:UUIDString/star`                 // GET
	CommentOnNewsRoute     = `tuso/:UUIDString/comment`              // POST
	GetNewsCommentRoute    = `tuso/:UUIDString/comments`             // GET
	DeleteNewsCommentRoute = `tuso/:UUIDString/comment/:CUUIDString` // DELETE
	GetAllUserNewsRoute    = `users/tusos`                           // GET
)

type Wand struct {
	Config *config.AthenaConfig
	Route  *gin.Engine
}

var b broker.Broker

func (w Wand) Engine() *gin.Engine {
	w.Route = gin.New()

	// Global middleware
	w.Route.Use(gin.Logger())
	w.Route.Use(gin.Recovery())
	b = NewBroker()
	// new relic monitor
	gorelic.InitNewrelicAgent("f243fdc54ca4b221bbabef85444e798a6d946335", "Huston", false)
	w.Route.Use(gorelic.Handler)
	w.Route.Use(ErrorHandler())
	w.Route.Use(InitHandler(w.Config))

	v1 := w.Route.Group(GroupRouteVersion1Key)
	{
		v1.Use(AuthorizationHandler())
		WrapNewsRoutes(v1)
	}

	return w.Route
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

func ParseQueryParameter(c *gin.Context) (*QueryParameter, error) {
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
	if Count == 0 {
		Count = 25
	}
	AllString := c.Query("all")
	All, err := SToB(AllString)
	if err != nil {
		return nil, err
	}
	OrderByString := c.Query("orderBy")
	qp := &QueryParameter{
		SinceID: int32(SinceID),
		MaxID:   int32(MaxID),
		Page:    int32(Page),
		Count:   int32(Count),
		OrderBy: OrderByString,
		All:     All,
	}

	return qp, nil
}
