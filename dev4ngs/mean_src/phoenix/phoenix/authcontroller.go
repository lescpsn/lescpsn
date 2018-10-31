package phoenix

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
)

func (bc *BaseController) CheckLogin(login *Login, session *sessions.Session, c *gin.Context) (bool, error, *dream.Admin) {
	admin, err := dream.GetAdminByName(bc.DB, login.UserName)
	if err != nil {
		fmt.Println(err.Error())
		return false, ServiceErr, nil
	}
	if admin == nil {
		return false, UserNotFoundErr, nil
	}
	//md5 the login pass
	md5Ctx := md5.New()
	md5Ctx.Write([]byte(login.Password))
	pass := hex.EncodeToString(md5Ctx.Sum(nil))

	if admin.Password != pass {
		return false, AuthErr, nil
	}
	session.Values["is_login"] = true
	session.Values["admin_name"] = admin.TrueName
	session.Values["admin_level"] = admin.LevelMap
	err = session.Save(c.Request, c.Writer)
	if err != nil {
		return false, ServiceErr, nil
	}
	return true, nil, admin
}
func (bc *BaseController) LoginOut(session *sessions.Session, c *gin.Context) error {
	session.Values = nil
	err := session.Save(c.Request, c.Writer)
	return err
}
