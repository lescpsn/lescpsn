// This file "user.go" is created by Lincan Li at 12/3/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package huston

import (
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"github.com/satori/go.uuid"
	"gopkg.in/mgo.v2/bson"
	"time"
	"qiniupkg.com/x/log.v7"
)

func WrapAccountRoutes(g *gin.RouterGroup) {
	CreateSchema(g)
	Reachability(g)
	LoginHandler(g)
	VerifyUsernameHandler(g)
	RegisterHandler(g)
	MobileRegisterHandler(g)
	SendRegisterSMSHandler(g)
	ValidateSMSCodeHandler(g)
	ForgetPassHandler(g)
	UpdatePassByCodeCodeHandler(g)
	InviteHandler(g)
	ClaimInvitationHandler(g)
	UpdatePassValidateHandler(g)
	DeleteAngelHandler(g)
	AddFriendForTestHandler(g)
	AddFollowForTestHandler(g)
}

func CreateSchema(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		m.CreateSchema()
		c.Writer.WriteHeader(204)
	}
	g.GET(CreateSchemaRoute, ReachabilityEndPoint)
}

func Reachability(g *gin.RouterGroup) {
	ReachabilityEndPoint := func(c *gin.Context) {
		c.Writer.WriteHeader(204)
	}
	g.GET(ReachabilityRoute, ReachabilityEndPoint)
}

func VerifyUsernameHandler(g *gin.RouterGroup) {
	VerifyUsernameEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		username := c.Param("username")

		if username == "" {
			panic(InvalidUserNameErr)
		}

		result, err := m.VerifyUsername(username)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(VerifyUsernameRoute, VerifyUsernameEndPoint)
}

type Register struct {
	UserName string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
}

func RegisterHandler(g *gin.RouterGroup) {
	RegisterEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		const DeviceTokenHeader = "X-Tuso-Device-Token"
		device := GetRequestHeader(c.Request.Header, DeviceTokenHeader)
		if device == "" {
			panic(RequestParamsErr)
		}

		var register Register
		if err := c.BindJSON(&register); err != nil {
			panic(RequestParamsErr)
		}

		d, err := m.RegisterByEmail(register.UserName, register.Password, device)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, d)
	}

	g.POST(RegisterRoute, RegisterEndPoint)
}

type SendRegisterSMS struct {
	Mobile string `form:"mobile" json:"mobile" binding:"required"`
}

func SendRegisterSMSHandler(g *gin.RouterGroup) {
	SendRegisterSMSEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var sms SendRegisterSMS
		if err := c.BindJSON(&sms); err != nil {
			panic(RequestParamsErr)
		}

		_, err := m.NewRegisterSMS(sms.Mobile)
		if err != nil {
			panic(err)
		}

		c.Writer.WriteHeader(204)
	}

	g.POST(SendRegisterSMSRoute, SendRegisterSMSEndPoint)
}

type SMSCodeValidation struct {
	Mobile string `form:"mobile" json:"mobile" binding:"required"`
	Code   string `form:"code" json:"code" binding:"required"`
}

func ValidateSMSCodeHandler(g *gin.RouterGroup) {
	ValidateSMSCodeEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var scv SMSCodeValidation
		if err := c.BindJSON(&scv); err != nil {
			panic(RequestParamsErr)
		}

		code, err := m.ValidateSMSCode(scv.Mobile, scv.Code)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, code)
	}

	g.POST(ValidateSMSCodeRoute, ValidateSMSCodeEndPoint)
}

type MobileRegister struct {
	UserName string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
	Secret   string `form:"secret" json:"secret" binding:"required"`
	Invite   string `form:"invite" json:"invite"`
}

func MobileRegisterHandler(g *gin.RouterGroup) {
	RegisterEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		const DeviceTokenHeader = "X-Tuso-Device-Token"
		device := GetRequestHeader(c.Request.Header, DeviceTokenHeader)
		if device == "" {
			panic(RequestParamsErr)
		}

		var mr MobileRegister
		if err := c.BindJSON(&mr); err != nil {
			panic(RequestParamsErr)
		}
		log.Print("Invite:", mr.Invite)
		user, err := m.RegisterByMobile(mr.UserName, mr.Password, mr.Secret, device)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, user)
	}

	g.POST(MobileRegisterRoute, RegisterEndPoint)
}

type ForgetPass struct {
	UserName string `form:"username" json:"username" binding:"required"`
}

func ForgetPassHandler(g *gin.RouterGroup) {
	ForgetPassEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		var forgetPass ForgetPass
		if err := c.BindJSON(&forgetPass); err != nil {
			panic(RequestParamsErr)
		}
		d, err := m.UpdateNewPasswordSecrets(forgetPass.UserName)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, d)
	}
	g.POST(ForgetPassRoute, ForgetPassEndPoint)
}

type UpdatePassValidate struct {
	UserName string `form:"username" json:"username" binding:"required"`
	Code     string `form:"code" json:"code" binding:"required"`
}

func UpdatePassValidateHandler(g *gin.RouterGroup) {
	EndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		var updatePassValidate UpdatePassValidate
		if err := c.BindJSON(&updatePassValidate); err != nil {
			panic(RequestParamsErr)
		}
		ok, err := m.ValidateNewPasswordCode(updatePassValidate.UserName, updatePassValidate.Code)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, ok)
	}
	g.PUT(UpdatePassValidateRoute, EndPoint)
}

type UpdatePassBySecretCode struct {
	UserName string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
	Code     string `form:"code" json:"code" binding:"required"`
}

func UpdatePassByCodeCodeHandler(g *gin.RouterGroup) {
	UpdatePassByCodeCodeEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var upbc UpdatePassBySecretCode
		if err := c.BindJSON(&upbc); err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.UpdatePassByCode(upbc.UserName, upbc.Password, upbc.Code)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)

	}
	g.PUT(UpdatePassByCodeRoute, UpdatePassByCodeCodeEndPoint)
}

type Login struct {
	UserName string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
}

func LoginHandler(g *gin.RouterGroup) {
	LoginEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		const DeviceTokenHeader = "X-Tuso-Device-Token"
		device := GetRequestHeader(c.Request.Header, DeviceTokenHeader)
		if device == "" {
			panic(RequestParamsErr)
		}

		var login Login
		if err := c.BindJSON(&login); err != nil {
			panic(RequestParamsErr)
		}

		user, err := m.Login(login.UserName, login.Password, device)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, user)
	}
	g.POST(LoginRoute, LoginEndPoint)
}

func InviteHandler(g *gin.RouterGroup) {
	InviteEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		inviteCode := c.Param("invite_code")

		if inviteCode == "" {
			panic(InvalidUserNameErr)
		}

		inv, err := m.ValidateInvitation(inviteCode)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, inv)
	}

	g.GET(InviteCodeRoute, InviteEndPoint)
}

type Claim struct {
	Count string `form:"count" json:"count" binding:"required"`
	Type  string `form:"type" json:"type" binding:"required"`
}

func ClaimInvitationHandler(g *gin.RouterGroup) {
	ClaimEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var cl Claim
		if err := c.BindJSON(&cl); err != nil {
			panic(RequestParamsErr)
		}
		count, err := SToI(cl.Count)
		claim, err := m.ClaimInvitationCode(count, cl.Type)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, claim)
	}

	g.PUT(ClaimInviteCodeRoute, ClaimEndPoint)
}

func WrapUserRoutes(g *gin.RouterGroup) {
	GetUserHandler(g)
	UpdateUserHandler(g)
	FollowHandler(g)
	UnFollowHandler(g)
	RequestFriendHandler(g)
	RejectApplyFriendHandler(g)
	AcceptApplyFriendHandler(g)
	EndFriendshipHandler(g)
	RemarkFriendsHandler(g)
	GetFriendsHandler(g)
	//FindUsersByNickNameHandler(g)
	FindUsersByTusoIDHandler(g)
	GetFollowersHandler(g)
	GetFolloweeHandler(g)
	NewPasswordValidatorHandler(g)
	NewPasswordRequestorHandler(g)
}

func GetUserHandler(g *gin.RouterGroup) {
	GetUserEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		result, err := m.GetUser(m.User, UUID)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetUserRoute, GetUserEndPoint)
}

type UpdateUser struct {
	RealName string     `form:"real_name" json:"real_name"`
	Nickname string     `form:"nickname" json:"nickname"`
	Birthday *time.Time `form:"birthday" json:"birthday"`
	Location *Location  `form:"location" json:"location"`
	Gender   string     `form:"gender" json:"gender"`
}

func UpdateUserHandler(g *gin.RouterGroup) {
	UpdateUserEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		var ip UpdateUser
		if err := c.BindJSON(&ip); err != nil {
			panic(RequestParamsErr)
		}
		//ip.Gender
		var gender Gender
		if ip.Gender != "" {
			gender = Str2Gender(ip.Gender)
		}
		result, err := m.UpdateUser(m.User, UUID, ip.RealName, ip.Nickname, ip.Birthday, ip.Location, gender)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.PUT(UpdateUserRoute, UpdateUserEndPoint)
}

type NewPasswordValidator struct {
	Password string `json:"password" binding:"required"`
}

func NewPasswordValidatorHandler(g *gin.RouterGroup) {
	UpdateUserEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		var nps NewPasswordValidator
		if err := c.BindJSON(&nps); err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.RequestNewPasswordValidation(m.User, nps.Password)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(ValidateNewPasswordRoute, UpdateUserEndPoint)
}

type NewPasswordRequestor struct {
	Password string `json:"password" binding:"required"`
	Secret   string `json:"secret" binding:"required"`
}

func NewPasswordRequestorHandler(g *gin.RouterGroup) {
	UpdateUserEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		var npr NewPasswordRequestor
		if err := c.BindJSON(&npr); err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.UpdateNewPassBySecret(m.User, npr.Password, npr.Secret)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.PUT(UpdatePasswordRoute, UpdateUserEndPoint)
}

//func FindUsersByNickNameHandler(g *gin.RouterGroup) {
//	EndPoint := func(c *gin.Context) {
//		m := c.MustGet(MeanControllerKey).(*MeanController)
//		nickname := c.Query("nickname")
//		qp, err := ParseQueryParameter(c)
//		if err != nil {
//			panic(RequestParamsErr)
//		}
//		result, err := m.GetUsersByNickName(nickname, qp)
//		if err != nil {
//			panic(err)
//		}
//
//		c.JSON(GenericsSuccessCode, result)
//	}
//
//	g.GET(GetUsersByNickNameRoute, EndPoint)
//}

func FindUsersByTusoIDHandler(g *gin.RouterGroup) {
	EndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		tusoID := c.Param("tusoID")
		result, err := m.GetUsersTusoID(tusoID)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetUsersByTusoIDRoute, EndPoint)
}

func FollowHandler(g *gin.RouterGroup) {
	FollowEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		userRelation, err := m.Follow(m.User, UUIDString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, userRelation)
	}

	g.PUT(FollowRoute, FollowEndPoint)
}

func UnFollowHandler(g *gin.RouterGroup) {
	UnFollowEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		userRelation, err := m.UnFollow(m.User, UUIDString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, userRelation)
	}

	g.PUT(UnFollowRoute, UnFollowEndPoint)
}

type MeanID struct {
	ID      string `form:"tuso_id" json:"tuso_id"`
	Message string `json:"message"`
}

func RequestFriendHandler(g *gin.RouterGroup) {
	RequestFriendEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUID := c.Param("UUIDString")

		var meanID MeanID
		if err := c.BindJSON(&meanID); err != nil {
			panic(RequestParamsErr)
		}

		var dData Dungeons
		var err error

		if meanID.ID != "" {
			dData, err = m.RequestFriendByTusoID(m.User, meanID.ID, meanID.Message)
		} else {
			dData, err = m.RequestFriend(m.User, UUID, meanID.Message)
		}
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, dData)
	}

	g.PUT(RequestFriendRoute, RequestFriendEndPoint)
}

type RejectApplyFriend struct {
	UUID     uuid.UUID `form:"UUID" json:"UUID" binding:"required"`
	ObjectId string    `form:"object_id" json:"object_id" binding:"required"`
}

func RejectApplyFriendHandler(g *gin.RouterGroup) {
	RejectApplyFriendEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var reject RejectApplyFriend
		if err := c.BindJSON(&reject); err != nil {
			panic(RequestParamsErr)
		}
		if !bson.IsObjectIdHex(reject.ObjectId) {
			panic(RequestParamsErr)
		}
		userRelation, err := m.RejectApplyFriend(m.User, reject.UUID, reject.ObjectId)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, userRelation)
	}

	g.PUT(RejectApplyFriendRoute, RejectApplyFriendEndPoint)
}

type Accept struct {
	UUID     uuid.UUID `form:"UUID" json:"UUID" binding:"required"`
	ObjectId string    `form:"object_id" json:"object_id" binding:"required"`
}

func AcceptApplyFriendHandler(g *gin.RouterGroup) {
	AcceptApplyFriendEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var accept Accept
		if err := c.BindJSON(&accept); err != nil {
			panic(RequestParamsErr)
		}
		if !bson.IsObjectIdHex(accept.ObjectId) {
			panic(RequestParamsErr)
		}
		userRelation, err := m.AcceptApplyFriend(m.User, accept.UUID, accept.ObjectId)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, userRelation)
	}

	g.PUT(AcceptApplyFriendRoute, AcceptApplyFriendEndPoint)
}

func EndFriendshipHandler(g *gin.RouterGroup) {
	EndFriendshipEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		var follow bool
		if c.Param("follow") == "true" {
			follow = true
		} else if c.Param("follow") == "false" {
			follow = false
		} else {
			panic(RequestParamsErr)
		}
		userRelation, err := m.EndFriendship(m.User, UUIDString, follow)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, userRelation)
	}

	g.PUT(EndFriendshipRoute, EndFriendshipEndPoint)
}

func RemarkFriendsHandler(g *gin.RouterGroup) {
	RemarkEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		remark := c.Param("remark")

		userRelation, err := m.Remark(m.User, UUIDString, remark)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, userRelation)
	}

	g.PUT(RemarkFriendsRoute, RemarkEndPoint)
}

//TODO 所有的验证码绑定生成的关系 需要加上follow_sum 之类的自增.
func GetFriendsHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.GetFriends(qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetFriendsRoute, h)
}

func GetFollowersHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.GetFollowers(qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetFollowerRoute, h)
}

func GetFolloweeHandler(g *gin.RouterGroup) {
	h := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}
		result, err := m.GetFollowee(qp)
		if err != nil {
			panic(err)
		}
		c.JSON(GenericsSuccessCode, result)
	}
	g.GET(GetFolloweeRoute, h)
}

func DeleteAngelHandler(g *gin.RouterGroup) {
	DeleteAngleEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		number := c.Param("phone_number")
		_, err := m.DeleteAngle(number)
		if err != nil {
			panic(err)
		}
		c.Writer.WriteHeader(204)
	}

	g.GET(DeleteAngelRoute, DeleteAngleEndPoint)
}

type Test struct {
	UserID string `form:"user_id" json:"user_id" binding:"required"`
	MinID  string `form:"user_id" json:"min_id" binding:"required"`
	MaxID  string `form:"user_id" json:"max_id" binding:"required"`
}

func AddFriendForTestHandler(g *gin.RouterGroup) {
	AddFriendForTestEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var test Test
		if err := c.BindJSON(&test); err != nil {
			panic(RequestParamsErr)
		}
		userID, err := SToI64(test.UserID)
		minID, err := SToI64(test.MinID)
		maxID, err := SToI64(test.MaxID)
		err = m.IosAddFriendForTest(userID, minID, maxID)
		if err != nil {
			panic(err)
		}
		c.Writer.WriteHeader(204)
	}
	g.PUT(AddFriendForTest, AddFriendForTestEndPoint)
}

func AddFollowForTestHandler(g *gin.RouterGroup) {
	AddFollowForTestEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var test Test
		if err := c.BindJSON(&test); err != nil {
			panic(RequestParamsErr)
		}
		userID, err := SToI64(test.UserID)
		minID, err := SToI64(test.MinID)
		maxID, err := SToI64(test.MaxID)
		err = m.IosAddMutualFollowForTest(userID, minID, maxID)
		if err != nil {
			panic(err)
		}
		c.Writer.WriteHeader(204)
	}
	g.PUT(AddFollowForTest, AddFollowForTestEndPoint)
}
