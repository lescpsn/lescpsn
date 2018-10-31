package wand

import (
	"git.ngs.tech/mean/athena/config"
	"git.ngs.tech/mean/athena/model"
	. "git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/context"
	"log"
	"net/http"
	"runtime/debug"
)

func InitHandler(husConf *config.AthenaConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		MDBSession, MDB := model.GetMDBAndMSession(config.GetMongoConf())
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
		}

		c.Writer.Header().Set("P3P", "CP=CURa ADMa DEVa PSAo PSDo OUR BUS UNI PUR INT DEM STA PRE COM NAV OTC NOI DSP COR")
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With, X-Tuso-Device-Token, X-Tuso-Authentication-Token, *")
		m := NewAthenaController(MDBSession, MDB, b)
		c.Set(AthenaControllerKey, m)
		c.Next()
	}
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		//mc := c.MustGet(AthenaControllerKey).(*AthenaController)
		defer func() {
			if err := recover(); err != nil {
				HandleError(c, err)
			} else if err := c.Errors.Last(); err != nil {
				HandleError(c, err)
			}
			//如果ok就不记录
		}()
		c.Next()
	}
}

func AuthorizationHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := c.MustGet(AthenaControllerKey).(*AthenaController)
		const TusoAuthHeader = "X-Tuso-Authentication-Token"
		token := GetRequestHeader(c.Request.Header, TusoAuthHeader)
		if token == "" {
			log.Print("token not found")
			c.Abort()
			panic(AuthErr)
		}
		uID, err := model.GetUserIDByToken(token)
		if err != nil || uID == 0 {
			log.Print("token not found", uID)
			c.Abort()
			panic(AuthErr)
		}
		rsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
			Id: uID,
		})
		if err != nil || rsp.Null {
			log.Print("user not found", uID, " ", err)
			c.Abort()
			panic(AuthErr)
		}

		const DeviceTokenHeader = "X-Tuso-Device-Token"
		device := GetRequestHeader(c.Request.Header, DeviceTokenHeader)
		uDeviceToken, err := model.GetDeviceTokenByUser(uID)
		if err != nil {
			log.Print("device token not found")
			c.Abort()
			panic(AuthErr)
		}
		if uDeviceToken != device {
			log.Print("device token not right", uDeviceToken)
			c.Abort()
			panic(DeviceErr)
		}

		mc.User = rsp.User
		c.Set(AthenaControllerKey, mc)
	}
}

func GetRequestHeader(header http.Header, key string) string {
	if values, _ := header[key]; len(values) > 0 {
		return values[0]
	}

	return ""
}

func HandleError(c *gin.Context, e interface{}) {
	var err *AthenaError
	debug.PrintStack()

	switch er := e.(type) {
	case *AthenaError:
		err = er
	default:
		err = ServerErr
	}

	c.JSON(err.HttpCode, gin.H{
		"code":    err.ErrorCode,
		"message": err.Message,
	})
}
