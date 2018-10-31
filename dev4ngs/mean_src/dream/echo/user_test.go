package echo_test

import (
	. "git.ngs.tech/mean/dream/dream"
	"git.ngs.tech/mean/dream/echo"
	. "github.com/smartystreets/goconvey/convey"
	"strconv"
	"testing"
)

//TestUserCreate
func TestUserCreate(t *testing.T) {

	Convey("To create a user", t, func() {
		s := SetupTest()
		D := s.D

		user1, err1 := D.NewEmailUser(buildEmail(), "123456", nil)
		user2, err2 := D.NewMobileUser(buildMobileNo(), "123456", nil)
		user3, err3 := D.NewAnonmyousUser(nil)

		Convey("Should be create success", func() {
			So(err1, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)
			So(user1, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
			So(user3, ShouldNotBeNil)
		})

		Reset(func() {
			TearDownTest(s)
		})
	})
}

//TestUserUpdate
func TestUserUpdate(t *testing.T) {

	Convey("To create a user and update it some info", t, func() {
		s := SetupTest()
		D := s.D
		mobile := buildMobileNo()
		user1, err1 := D.NewMobileUser(mobile, "123456", nil)
		user2, err2 := D.GetUserByMobileNumber(mobile, nil)
		user2.Nickname = NewValidNullString("小明")
		user2.RealName = NewValidNullString("真小明")
		user2.Gender = 2

		user3, err3 := D.UpdateUser(user2.UUID, user2, nil)
		user4, err4 := D.GetUserByMobileNumber(mobile, nil)

		Convey("Should be update success", func() {
			So(err1, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)
			So(err4, ShouldBeNil)
			So(user1, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
			So(user3, ShouldNotBeNil)
			So(user4, ShouldNotBeNil)
			So(user2.Nickname.String, ShouldEqual, user4.Nickname.String)
			So(user2.RealName.String, ShouldEqual, user4.RealName.String)
			So(user2.Gender, ShouldEqual, user4.Gender)

		})

		Reset(func() {
			TearDownTest(s)
		})
	})
}

//TestUserPatch
func TestUserPatch(t *testing.T) {

	Convey("To create a user and update it some info", t, func() {
		s := SetupTest()
		D := s.D
		mobile := buildMobileNo()
		user1, err1 := D.NewMobileUser(mobile, "123456", nil)
		user2, err2 := D.GetUserByMobileNumber(mobile, nil)

		usr3 := echo.UserEcho{}

		usr3.UUID = user2.UUID
		usr3.Nickname = NewValidNullString("小明")
		usr3.RealName = NewValidNullString("真小明")
		usr3.Email = NewValidNullString("shang@123.com")
		usr3.Gender = 2

		user3, err3 := D.PatchUser(&usr3, nil)
		user4, err4 := D.GetUserByMobileNumber(mobile, nil)

		Convey("Should be update success", func() {
			So(err1, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)
			So(err4, ShouldBeNil)
			So(user1, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
			So(user3, ShouldNotBeNil)
			So(user4, ShouldNotBeNil)
			So(user2.Nickname.String, ShouldNotEqual, user4.Nickname.String)
			So(user2.RealName.String, ShouldNotEqual, user4.RealName.String)
			So(user2.Gender, ShouldNotEqual, user4.Gender)
			So(user2.Email.String, ShouldNotEqual, user4.Email.String)

		})

		Reset(func() {
			TearDownTest(s)
		})
	})
}

//TestUserPasswordPatch
func TestUserPasswordPatch(t *testing.T) {

	Convey("To create a user and update this account password ", t, func() {
		s := SetupTest()
		D := s.D
		mobile := buildMobileNo()
		user1, err1 := D.NewMobileUser(mobile, "123456", nil)
		user2, err2 := D.GetUserByMobileNumber(mobile, nil)
		user2.Password = NewValidNullString("654321")
		user6, err6 := FirstUserByUUID(D.RDB, echo.Str2UUID(user2.UUID))
		user3, err3 := D.PatchUserPassword(user2.UUID, user2.Password.String, nil)
		user4, err4 := D.GetUserByMobileNumber(mobile, nil)
		user5, err5 := FirstUserByUUID(D.RDB, echo.Str2UUID(user2.UUID))

		Convey("Should be change password success", func() {
			So(err1, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)
			So(err4, ShouldBeNil)
			So(err5, ShouldBeNil)
			So(err6, ShouldBeNil)
			So(user1, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
			So(user3, ShouldNotBeNil)
			So(user4, ShouldNotBeNil)
			So(user5, ShouldNotBeNil)
			So(user2.Password.String, ShouldNotEqual, user4.Password.String)
			So(user6.Salt, ShouldNotEqual, user5.Salt)
		})

		Reset(func() {
			TearDownTest(s)
		})
	})
}

//TestUserFinds
func TestUserFinds(t *testing.T) {

	Convey("To create some account and to find them by params", t, func() {
		s := SetupTest()
		D := s.D
		mobile1 := buildMobileNo()
		mobile2 := buildMobileNo()

		email := buildEmail()

		user1, err1 := D.NewMobileUser(mobile1, "123456", nil)
		user01, err01 := D.NewMobileUser(mobile2, "123456", nil)
		user2, err2 := D.NewEmailUser(email, "123456", nil)

		user3, err3 := D.GetUserByMobileNumber(mobile1, nil)
		user03, err03 := D.GetUserByMobileNumber(mobile2, nil)
		user4, err4 := D.GetUserByID(user3.ID, nil)
		user5, err5 := D.GetUserByUUID(user3.UUID, nil)
		user6, err6 := D.GetUserByEmail(email, nil)

		user7, err7 := D.GetUserByIDs([]string{strconv.FormatInt(user3.ID, 10), strconv.FormatInt(user03.ID, 10), strconv.FormatInt(user6.ID, 10)}, nil)
		user8, err8 := D.GetUserByUUIDs([]string{user3.UUID, user03.UUID, user6.UUID}, nil)

		user9, err9 := D.GetUserByMobileNumbers([]string{mobile1, mobile2}, nil)

		Convey("Should be have some info about it", func() {
			So(err1, ShouldBeNil)
			So(err01, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)
			So(err03, ShouldBeNil)
			So(err4, ShouldBeNil)
			So(err5, ShouldBeNil)
			So(err6, ShouldBeNil)
			So(err7, ShouldBeNil)
			So(err8, ShouldBeNil)
			So(err9, ShouldBeNil)
			So(user1, ShouldNotBeNil)
			So(user01, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
			So(user3, ShouldNotBeNil)
			So(user03, ShouldNotBeNil)
			So(user4, ShouldNotBeNil)
			So(user5, ShouldNotBeNil)
			So(user7, ShouldNotBeNil)
			So(user8, ShouldNotBeNil)
			So(user9, ShouldNotBeNil)

			So(user3.MobileNumber.String, ShouldEqual, mobile1)
			So(user03.MobileNumber.String, ShouldEqual, mobile2)

			So(user4.MobileNumber.String, ShouldEqual, mobile1)
			So(user5.MobileNumber.String, ShouldEqual, mobile1)

			So(user6.Email.String, ShouldEqual, email)

			So(len(user7), ShouldEqual, 3)
			So(len(user8), ShouldEqual, 3)
			So(len(user9), ShouldEqual, 2)

		})

		Reset(func() {
			TearDownTest(s)
		})
	})
}
