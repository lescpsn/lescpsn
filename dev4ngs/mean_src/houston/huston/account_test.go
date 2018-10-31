package huston_test

import (
	. "git.ngs.tech/mean/houston/model"
	dream "git.ngs.tech/mean/proto"
	"github.com/micro/go-micro/client"
	. "github.com/smartystreets/goconvey/convey"
	"golang.org/x/net/context"
	"testing"
)

func TestRegister(t *testing.T) {
	Convey("基于账户信息", t, func() {
		h := NewSuit()

		email := "test_jermine@qq.com"
		password := "123456"
		mobile := "18752000738"
		device := "hohohoho"

		Convey("通过邮件注册用户", func() {
			result, err := h.M.RegisterByEmail(email, password, device)
			So(err, ShouldBeNil)
			So(result, ShouldNotBeNil)

			Convey("注册相同邮箱的用户, 注册应该失败", func() {
				result1, err1 := h.M.RegisterByEmail(email, password, device)
				So(err1, ShouldNotBeNil)
				So(result1, ShouldBeNil)
			})
		})

		Convey("通过手机号注册用户", func() {
			code, err := h.M.NewRegisterSMS(mobile)
			dMap, err := h.M.ValidateSMSCode(mobile, code)
			result, err := h.M.RegisterByMobile(mobile, password, dMap[`secret`].(string), device)
			So(err, ShouldBeNil)
			So(result, ShouldNotBeNil)

			Convey("注册相同手机号的用户, 注册应该失败", func() {
				code, err = h.M.NewRegisterSMS(mobile)
				dMap, err = h.M.ValidateSMSCode(mobile, code)
				result, err = h.M.RegisterByMobile(mobile, password, dMap[`secret`].(string), device)

				So(err, ShouldNotBeNil)
				So(result, ShouldBeNil)
			})
		})

		Reset(func() {
			h.tearDown()
		})
	})
}

//TestAccountLoginAndUpdatePassword
func TestLogin(t *testing.T) {
	Convey("初始化一些用户", t, func() {
		h := NewSuit()
		cl := dream.NewDreamServicesClient("go.micro.srv.greeter", client.DefaultClient)
		rsp, err := cl.NewEmailUser(context.TODO(), &dream.PostAccountRequest{
			Username: buildEmail(),
			Password: "123456",
		})
		eUser := rsp.User
		So(err, ShouldBeNil)
		So(eUser, ShouldNotBeNil)

		rsp, err = cl.NewMobileUser(context.TODO(), &dream.PostAccountRequest{
			Username: buildMobileNo(),
			Password: "123456",
		})
		mUser := rsp.User
		So(err, ShouldBeNil)
		So(mUser, ShouldNotBeNil)

		device := "PccsfEypbTmVZHWowfX7usyS5It5tdkt"

		Convey("尝试登陆", func() {
			_, err := h.M.Login(eUser.Email.String, "123456", device)
			So(err, ShouldBeNil)

			_, err1 := h.M.Login(mUser.MobileNumber.String, "123456", device)
			So(err1, ShouldBeNil)

			_, err2 := h.M.LoginByEmail(eUser.Email.String, "123456", device)
			So(err2, ShouldBeNil)

			_, err3 := h.M.LoginByPhoneNumber(mUser.MobileNumber.String, "123456", device)
			So(err3, ShouldBeNil)

		})
		Reset(func() {
			h.tearDown()
		})
	})
}
