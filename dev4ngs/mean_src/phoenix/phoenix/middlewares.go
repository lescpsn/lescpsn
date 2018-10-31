package phoenix

import (
	"git.ngs.tech/mean/phoenix/config"
	"git.ngs.tech/mean/phoenix/dream"
	"git.ngs.tech/mean/phoenix/log"
	"github.com/Sirupsen/logrus"
	"github.com/gin-gonic/gin"
	"gopkg.in/boj/redistore.v1"
	lg "log"
	"runtime/debug"
	"strings"
	"time"
)

const (
	ControllerKey = "BaseControllerKey"
)
const (
	ErrorTypeKey    = "phoenixErrKey"
	SessionKey      = "phoenix"
	SessionStoreKey = "phoenix-sdfhi-ucnsui2-3434"
)

func InitHandler(phoConf *config.PhoenixConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		logger := log.NewLogger()

		//TODO session这边有不合理的地方,下次修改 会不会每次都创建一个连接
		store, err := redistore.NewRediStore(10, "tcp", ":6379", "", []byte(SessionStoreKey))
		if err != nil {
			panic(err)
		}
		defer store.Close()
		session, err := store.Get(c.Request, SessionKey)
		if err != nil {
			panic(ServiceErr)
		}

		DB := dream.GetX(phoConf.Dream, logger)
		transaction := dream.Begin(DB)
		m := NewBaseController(transaction, session, logger)
		c.Set(ControllerKey, m)
		c.Writer.Header().Set("P3P", "CP=CURa ADMa DEVa PSAo PSDo OUR BUS UNI PUR INT DEM STA PRE COM NAV OTC NOI DSP COR")
		c.Next()

		end := time.Now()
		latency := end.Sub(start)

		entry := logger.WithFields(logrus.Fields{
			"status":     c.Writer.Status(),
			"method":     c.Request.Method,
			"path":       path,
			"ip":         c.ClientIP(),
			"latency":    latency,
			"user-agent": c.Request.UserAgent(),
			"time":       end.Format(time.RFC3339),
		})
		entry.Info("")
	}
}

//TODO 记录日志
func AuthorizationHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		ct := c.MustGet(ControllerKey).(*BaseController)
		//m := ct.DB
		session := ct.Session
		isLogin, b := session.Values["is_login"].(bool)
		//TODO 修改成默认的错误返回方式
		if !b {
			panic(AuthErr)
		}
		if !isLogin {
			panic(AuthErr)
		}
		ct.Admin = &dream.Admin{
			UserName: session.Values["admin_name"].(string),
			LevelMap: session.Values["admin_level"].([]string),
		}
		if !b {
			panic(AuthErr)
		}
		if ct.Admin == nil {
			//TODO empty the session
			panic(AuthErr)
		}

		urlMap := strings.Split(c.Request.RequestURI, "/")
		rPath := "/"
		if len(urlMap) > 3 {
			rPath = urlMap[2] + "/" + urlMap[3]
		}
		pass := false
		for _, l := range ct.Admin.LevelMap {
			if l == rPath || l == "*" {
				pass = true
			}
		}
		if pass {
			c.Next()
		} else {
			panic(AuthErr)
		}

	}
}

func HeaderErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(ErrorTypeKey, ErrorTypePublic)
		c.Next()
	}
}

type BodyError struct {
	Success bool            `json:"success"`
	Error   *PhoenixDefault `json:"error,omitempty"`
	Data    interface{}     `json:"data,omitempty"`
}

//TODO 暂时还没有加上
func BodyErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(ErrorTypeKey, ErrorTypePublic)
		c.Next()
	}
}

func ErrorDBTransactionHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		bc := c.MustGet(ControllerKey).(*BaseController)
		transaction := bc.DB

		defer func() {
			if err := recover(); err != nil {
				HandleError(c, err)
				dream.Rollback(transaction)

			} else if err := c.Errors.Last(); err != nil {
				HandleError(c, err)
				dream.Rollback(transaction)

			} else {
				dream.Commit(transaction)
			}
		}()
		c.Next()
	}
}
func HandleError(c *gin.Context, e interface{}) {
	ht := c.MustGet(ErrorTypeKey).(ErrorType)

	lg.Print(e)
	debug.PrintStack()

	var err *PhoenixDefault

	switch er := e.(type) {
	case *PhoenixDefault:
		err = er

	case *gin.Error:
		meta := er.Meta.(gin.H)
		err = NewPhoenixError(meta["message"].(string), meta["code"].(int), 500, ErrorTypeInternal)

	default:
		err = ServiceErr
	}
	if ht == ErrorTypePublic {
		c.JSON(err.HttpCode, gin.H{
			"code":    err.ErrorCode,
			"message": err.Message,
		})
	} else {
		err := BodyError{
			Success: false,
			Error:   err,
		}
		c.JSON(200, err)
	}
}
