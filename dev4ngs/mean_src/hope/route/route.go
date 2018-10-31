package route

import (
	"git.ngs.tech/mean/hope/service"
	proto_struct "git.ngs.tech/mean/proto"
	//"github.com/brandfolder/gin-gorelic"
	"github.com/gin-gonic/gin"
	"github.com/micro/go-micro/broker"
	"github.com/micro/go-platform/config"
	"github.com/micro/go-platform/trace"
	"github.com/micro/go-plugins/broker/kafka"
	"log"
	"strconv"
)

const (
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

//AccountDynamics
const (
	//NewNoticeRoute            = `notice/`              //POST
	UpdateNoticeByIDRoute     = `notice/read/:ID` //PUT
	DeleteNoticeByIDRoute     = `notice/:ID`      //DELETE
	FindNoticeByUserUUIDRoute = `users/notice`    //GET
	FindMyNoticeByUserUUIDRoute = `users/my_notice`    //GET
	GetNoticeByIDRoute        = `notice/item/:ID` //GET
)

type Mean struct {
	Route *gin.Engine
}

func (m Mean) Engine(c config.Config, t trace.Trace) *gin.Engine {
	m.Route = gin.New()
	// Global middleware
	m.Route.Use(gin.Logger())
	//m.Route.Use(LoggerWithWriter())
	m.Route.Use(gin.Recovery())
	NewBroker()

	//TODO 性能检测目前先停用,等需要添加上
	// new relic monitor
	//gorelic.InitNewrelicAgent("f243fdc54ca4b221bbabef85444e798a6d946335", "Huston", false)
	//m.Route.Use(gorelic.Handler)

	m.Route.Use(InitHandler())
	m.Route.Use(ErrorDBTransactionHandler())
	m.Route.Use(HeaderErrorHandler())

	v1 := m.Route.Group(GroupRouteVersion1Key)
	{
		v1.Use(AuthorizationHandler())
		WrapNoticeRoutes(v1)
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

func ParseQueryParameter(c *gin.Context) (*proto_struct.QueryParameter, error) {
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
	//初始化count,放置后面调取不到
	if Count == 0 {
		Count = 25
	}
	AllString := c.Query("all")
	All, err := SToB(AllString)
	if err != nil {
		return nil, err
	}
	qp := &proto_struct.QueryParameter{
		SinceID: int32(SinceID),
		MaxID:   int32(MaxID),
		Page:    int32(Page),
		Count:   int32(Count),
		All:     All,
	}

	return qp, nil
}

func Register(o *broker.Options) {
	o = &broker.Options{
		Addrs: []string{service.Conf_GetValue(service.KAFKA_ADDR)},
	}
}

func NewBroker() broker.Broker {
	b := kafka.NewBroker(Register)
	err := b.Connect()
	if err != nil {
		log.Println(err)
	}
	//处理动态并插入到mongo
	_, err = b.Subscribe(hopeBrokerTopic, NoticeHandle)
	if err != nil {
		log.Println(err)
	}
	return b
}
