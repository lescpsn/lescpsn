package hera

import (
	"fmt"
	"git.ngs.tech/mean/hera/config"
	"git.ngs.tech/mean/hera/libgo"
	. "git.ngs.tech/mean/hera/model"
	dream "git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/context"
	"time"
)

func WrapSockpuppetRoutes(g *gin.RouterGroup) {
	BatchAddSockpuppetHandler(g)
	BatchGetSockpuppetHandler(g)
	BatchSetSockpuppetHandler(g)
	BatchDeleteSockpuppetHandler(g)
	SockpuppetStarToTusoHandler(g)
}

// 批量生成马甲号
func BatchAddSockpuppetHandler(g *gin.RouterGroup) {
	BatchAddEndPoint := func(c *gin.Context) {
		//暂且一次生成10个马甲号，后面根据需求改成参数形式
		avatarconfig, _ := config.GetAvatarConfig()
		nicknameNum := len(avatarconfig.NickName)
		avatarurlNum := len(avatarconfig.AvatarUrl)
		for i := 0; i < 10; i++ {
			mobile := libgo.ItoStr(libgo.RandInt(13000000000, 18900000000))
			password := mobile
			status := dream.Status_user_status_sockpuppet

			// 号码在数据库中不存在，可以建立
			rsp, _ := Cl.GetUserByMobileNumber(context.TODO(), &dream.GetUserByMobileRequest{
				Mobile: mobile,
			})
			if rsp != nil && rsp.Null == true {
				// 创建用户
				user, errors := Cl.NewMobileUser(context.TODO(), &dream.PostAccountRequest{
					Username: mobile,
					Password: password,
					Status:   dream.Status(status),
				})
				if errors != nil {
					panic(errors)
				}
				// 修改昵称
				randomNickname := GetRandomNikeName(avatarconfig, libgo.RandInt(0, nicknameNum))
				user.User.Nickname = &dream.StringType{String_: randomNickname}
				Cl.UpdateUser(context.TODO(), &dream.PutUserByUUIDRequest{
					UUID: user.User.UUID,
					User: user.User,
				})
				// mongodb中添加头像的url
				randomAvatarurl := GetRandomAvatarUrl(avatarconfig, libgo.RandInt(0, avatarurlNum))
				m := c.MustGet(MeanControllerKey).(*HeraController)
				avatar := &UserAvatar{
					UserUUID:  user.User.UUID,
					AvatarURL: randomAvatarurl,
					Timestamp: time.Now(),
					Active:    true,
				}
				InsertAvatar(m.MDB, avatar)
			}
		}

		result := []map[string]interface{}{{"method": "POST", "name": "this is a BatchAddSockpuppetHandler"}}
		c.JSON(GenericsSuccessCode, result)
	}
	g.POST(BatchAddSockpuppetsRoute, BatchAddEndPoint)
}

// 取回马甲号
func BatchGetSockpuppetHandler(g *gin.RouterGroup) {
	BatchGetEndPoint := func(c *gin.Context) {
		// UUIDs: nil 取所有马甲用户
		rsp, errors := Cl.BatchGetSockpuppet(context.TODO(), &dream.SockpuppetRequest{
			UUIDs: nil,
		})
		if errors != nil {
			panic(errors)
		}
		users := rsp.User
		c.JSON(GenericsSuccessCode, users)
	}
	g.GET(BatchGetSockpuppetsRoute, BatchGetEndPoint)
}

// 批量修改设置马甲号
func BatchSetSockpuppetHandler(g *gin.RouterGroup) {
	BatchSetEndPoint := func(c *gin.Context) {
		rsp, errors := Cl.BatchGetSockpuppet(context.TODO(), &dream.SockpuppetRequest{
			UUIDs: nil,
		})
		if errors != nil {
			panic(errors)
		}
		users := rsp.User
		for _, user := range users {
			user.Gender = dream.Gender(libgo.RandInt(0, 3))
			user.Birthday = string(libgo.RandBirth(18, 60).Format(time.RFC3339))
			Cl.UpdateUser(context.TODO(), &dream.PutUserByUUIDRequest{
				UUID: user.UUID,
				User: user,
			})
		}
		result := []map[string]interface{}{{"method": "POST", "name": "this is a BatchSetSockpuppetHandler"}}
		c.JSON(GenericsSuccessCode, result)
	}
	g.PUT(BatchSetSockpuppetRoute, BatchSetEndPoint)
}

// 批量删除马甲号
func BatchDeleteSockpuppetHandler(g *gin.RouterGroup) {
	BatchDeleteEndPoint := func(c *gin.Context) {
		// UUIDs: nil 删除所有马甲用户
		_, errors := Cl.BatchDeleteSockpuppet(context.TODO(), &dream.SockpuppetRequest{
			UUIDs: nil,
		})
		if errors != nil {
			panic(errors)
		}
	}
	g.DELETE(BatchDeleteSockpuppetRoute, BatchDeleteEndPoint)
}

// 马甲号对图说点赞
func SockpuppetStarToTusoHandler(g *gin.RouterGroup) {
	hf := func(c *gin.Context) {
		fmt.Println("This is SockpuppetToTusoHandler t101:", SockpuppetStarToTusoRoute)
		// 获取参数
		var sstt SockpuppetStarToTuso
		if err := c.BindJSON(&sstt); err != nil {
			panic(RequestParamsErr)
		}
		fmt.Println("This is SockpuppetToTusoHandler t102:", sstt)
	}
	g.POST(SockpuppetStarToTusoRoute, hf)
}
