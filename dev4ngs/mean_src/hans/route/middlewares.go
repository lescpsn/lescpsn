// This file "middlewares" is created by Lincan Li at 1/7/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package route

import (
	"bufio"
	"bytes"
	. "git.ngs.tech/mean/daniel/utils"
	. "git.ngs.tech/mean/hans/config"
	. "git.ngs.tech/mean/hans/controller"
	huModel "git.ngs.tech/mean/houston/model"
	dream "git.ngs.tech/mean/proto"
	"github.com/Sirupsen/logrus"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/context"
	"log"
	lg "log"
	"net/http"
	"runtime/debug"
	"time"
)

type bufferedWriter struct {
	gin.ResponseWriter
	out    *bufio.Writer
	Buffer bytes.Buffer
}

func (g *bufferedWriter) Write(data []byte) (int, error) {
	g.Buffer.Write(data)
	return g.out.Write(data)
}

func InitHandler(husConf *HansConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		DB := GetX(GetDreamConf(), nil)
		transaction := Begin(DB)
		MDBSession, MDB := GetMDBAndMSession(GetMongoConf())

		m := NewMeanController(transaction, MDBSession, MDB)
		c.Set(MeanControllerKey, m)
		c.Next()
	}
}

func GetRequestHeader(header http.Header, key string) string {
	if values, _ := header[key]; len(values) > 0 {
		return values[0]
	}
	return ""
}

func AuthorizationHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := c.MustGet(MeanControllerKey).(*MeanController)

		const TusoAuthHeader = "X-Tuso-Authentication-Token"
		token := GetRequestHeader(c.Request.Header, TusoAuthHeader)
		if token == "" {
			log.Print("token not found")
			c.Abort()
			panic(AuthErr)
		}

		uID, err := huModel.GetUserIDByToken(token)
		if err != nil || uID == 0 {
			log.Print("token not found", uID)
			c.Abort()
			panic(AuthErr)
		}

		rsp, err := Cl.GetUserByID(context.TODO(), &dream.GetByIDRequest{
			Id: uID,
		})
		if err != nil || rsp.Null {
			log.Print("user not found", uID, " ", err)
			c.Abort()
			panic(AuthErr)
		}

		const DeviceTokenHeader = "X-Tuso-Device-Token"
		device := GetRequestHeader(c.Request.Header, DeviceTokenHeader)

		uDeviceToken, err := huModel.GetDeviceTokenByUser(uID)
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
		c.Set(MeanControllerKey, mc)
	}
}

func HeaderErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(MeanErrorHandelKey, MeanErrorHandleTypeHeader)
		c.Next()
	}
}

type BodyError struct {
	Success bool        `json:"success"`
	Error   *MeanError  `json:"error,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func BodyErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(MeanErrorHandelKey, MeanErrorHandelTypeBody)
		c.Next()
	}
}

func ErrorDBTransactionHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := c.MustGet(MeanControllerKey).(*MeanController)
		transaction := mc.RDB

		defer func() {
			if err := recover(); err != nil {
				HandleError(c, err)
				Rollback(transaction)

			} else if err := c.Errors.Last(); err != nil {
				HandleError(c, err)
				Rollback(transaction)

			} else {
				Commit(transaction)
			}
		}()
		c.Next()
	}
}

func HandleError(c *gin.Context, e interface{}) {
	ht := c.MustGet(MeanErrorHandelKey).(MeanErrorHandleType)

	lg.Print(e)
	debug.PrintStack()

	var err *MeanError

	switch er := e.(type) {
	case *MeanError:
		err = er

	case *gin.Error:
		if er == nil {
			return
		}
		meta := er.Meta.(gin.H)
		err = NewMeanError(meta["message"].(string), meta["code"].(int), 500, ErrorTypeInternal)

	default:
		err = ServerErr
	}

	if ht == MeanErrorHandleTypeHeader {
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

// Instance a Logger middleware with the specified writter buffer.
// Example: os.Stdout, a file opened in write mode, a socket...
func LoggerWithWriter() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		start := time.Now()
		path := c.Request.URL.Path

		// Process request
		c.Next()

		// Stop timer
		end := time.Now()
		latency := end.Sub(start)

		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		//statusColor := colorForStatus(statusCode)
		//methodColor := colorForMethod(method)
		comment := c.Errors.ByType(gin.ErrorTypePrivate).String()

		//jsonRequest,_:=json.Marshal(c.Request)

		//fmt.Println(c.Accepted,c.Errors,c.Err(),c.Params,jsonRequest)

		//gin的请求日志:
		logrus.SetFormatter(&logrus.TextFormatter{})

		// A common pattern is to re-use fields between logging statements by re-using
		// the logrus.Entry returned from WithFields()
		contextLogger := logrus.WithFields(logrus.Fields{
			"latency":    latency,
			"clientIP":   clientIP,
			"method":     method,
			"statusCode": statusCode,
			"comment":    comment,
			"path":       path,
		})

		contextLogger.Level = logrus.FatalLevel
		contextLogger.Message = "This log is about http request of gin!"
		contextLogger.Time = time.Now()

		byt, _ := contextLogger.Reader()

		ToEchoLogFile("logs", byt.Bytes(), 1024*1024*5)

	}
}
