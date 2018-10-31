package phoenix

import (
	"github.com/gin-gonic/gin"
)

func WrapAccountRoutes(g *gin.RouterGroup) {
	//	RegisterHandler(g)
	LoginHandler(g)
	LoginOutHandler(g)
}

type Login struct {
	UserName string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
}

func LoginHandler(g *gin.RouterGroup) {
	LoginEndPoint := func(c *gin.Context) {
		var login Login
		bt := c.MustGet(ControllerKey).(*BaseController)
		if err := c.Bind(&login); err != nil {
			panic(RequestParamsErr)
		}
		ok, err, admin := bt.CheckLogin(&login, bt.Session, c)
		if err != nil {
			panic(err)
		}
		if !ok {
			panic(LoginErr)
		}
		c.JSON(200, gin.H{
			"code":    0,
			"message": "ok",
			"admin": gin.H{
				"name":  admin.TrueName,
				"email": admin.Email,
				"phone": admin.PhoneNumber,
				"level": admin.LevelMap,
			},
		})
	}
	g.POST(LoginRoute, LoginEndPoint)
}
func LoginOutHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		bt := c.MustGet(ControllerKey).(*BaseController)
		bt.LoginOut(bt.Session, c)
		c.JSON(200, gin.H{
			"code":    0,
			"message": "ok",
		})
	}
	g.GET(LoginOutRoute, h)
}
