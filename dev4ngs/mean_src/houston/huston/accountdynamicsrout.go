package huston

import (
	"github.com/gin-gonic/gin"
	"qiniupkg.com/x/errors.v7"
)

func WrapAccountDynamicsRoutes(g *gin.RouterGroup) {
	//NewAccountDynamics(g)
	GetAccountDynamicsByIDHandler(g)
	FindAccountDynamics(g)
	MakeAccountDynamicsReadHandler(g)
	DeleteAccountDynamicsByIDHandler(g)

}

//NewAccountDynamics 创建用户动态
//func NewAccountDynamics(g *gin.RouterGroup) {
//	ReachabilityEndPoint := func(c *gin.Context) {
//		m := c.MustGet(MeanControllerKey).(*MeanController)
//		var d model.AccountDynamics
//		if err := c.Bind(&d); err != nil {
//			panic(RequestParamsErr)
//		}
//
//		result, err := m.NewAccountDynamics(&d)
//		if err != nil {
//			panic(err)
//		}
//		c.JSON(GenericsSuccessCode, result)
//	}
//	g.POST(NewAccountDynamicsRoute, ReachabilityEndPoint)
//}

// GetAccountDynamicsByIDHandler 方法: 根据动态id获取动态信息
func GetAccountDynamicsByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.FirstAccountDynamicsByUUID(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetAccountDynamicsByIDRoute, ReachabilityEndPoint)
}

// FindAccountDynamics 方法: 根据用户uuid,动态id,以及状态查询分页信息
func FindAccountDynamics(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		usrID := c.Param("UUID")
		if usrID == "" {
			panic(errors.New("user uuid is required ! pls try again !"))
		}
		SinceIDString := c.Query("since_id")
		MaxIDString := c.Query("max_id")
		CountString := c.DefaultQuery("count", "100")
		Count, err := SToI(CountString)
		if err != nil {
			panic(err)
		}
		StatusString := c.Query("status")

		if err != nil {
			panic(err)
		}
		result, err := m.FindAccountDynamics(usrID, SinceIDString, MaxIDString, StatusString, Count)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(FindAccountDynamicsByUserUUIDRoute, ReachabilityEndPoint)
}

// MakeAccountDynamicsReadHandler 方法: 根据id将消息更改为已读信息
func MakeAccountDynamicsReadHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.MakeAccountDynamicsRead(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, gin.H{"success": result})
	}
	g.PUT(UpdateAccountDynamicsByIDRoute, ReachabilityEndPoint)
}

// DeleteAccountDynamicsByIDHandler 方法: 根据id删除动态信息
func DeleteAccountDynamicsByIDHandler(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		ID := c.Param("ID")
		result, err := m.DeleteAccountDynamics(ID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, gin.H{"success": result})
	}
	g.DELETE(DeleteAccountDynamicsByIDRoute, ReachabilityEndPoint)
}
