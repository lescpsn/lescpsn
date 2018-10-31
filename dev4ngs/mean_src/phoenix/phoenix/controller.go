package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
	"git.ngs.tech/mean/phoenix/log"
	"github.com/Unknwon/goconfig"
	"github.com/gorilla/sessions"
	"github.com/jinzhu/gorm"
)

type BaseController struct {
	DB      *gorm.DB
	Session *sessions.Session
	Admin   *dream.Admin
	Logger  *log.MeanLogger
	Config  *goconfig.ConfigFile
}

func NewBaseController(db *gorm.DB, session *sessions.Session, logger *log.MeanLogger) *BaseController {
	return &BaseController{
		DB:      db,
		Session: session,
		Admin:   &dream.Admin{},
		Logger:  logger,
	}
}
