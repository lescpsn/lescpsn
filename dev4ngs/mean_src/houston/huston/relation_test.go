package huston_test

import (
	. "git.ngs.tech/mean/houston/model"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

//TestUserGetInfo
func TestUserRelation(t *testing.T) {

	Convey("Setup and create user to test user relation operation", t, func() {

		var (
			email1   = buildEmail()
			email2   = buildEmail()
			email3   = buildEmail()
			password = "123456"
			device   = "hohohoho"
		)

		suite := NewSuit()
		m := suite.M

		user1, err1 := m.RegisterByEmail(email1, password, device)
		user2, err2 := m.RegisterByEmail(email2, password, device)
		user3, err3 := m.RegisterByEmail(email3, password, device)
		user4, err4 := DCenter.GetUserByEmail(email1)
		user5, err5 := DCenter.GetUserByEmail(email2)
		user6, err6 := DCenter.GetUserByEmail(email3)

		//user7,err7 := model.DCenter.GetUserByEmail(email2)

		Convey("Should be registed success ", func() {

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
			So(user6, ShouldNotBeNil)

		})

		//Convey("To follow a account by uuid", func() {
		//
		//	result, err := m.Follow(user1, user2.UUID)
		//	m.User = user1
		//	result1, err1 := m.GetFollowee()
		//
		//	Convey("This account should be has a follow account ,and follow successfully", func() {
		//		So(err, ShouldBeNil)
		//		So(result, ShouldNotBeNil)
		//		So(err1, ShouldBeNil)
		//		So(result1, ShouldNotBeNil)
		//	})
		//
		//})

		//Convey("To unfollow a account by uuid ", func() {
		//	result, err := m.Follow(user1, user2.UUID)
		//	result1, err1 := m.UnFollow(user1, user2.UUID)
		//	m.User = user1
		//	result2, err2 := m.GetFollowee()
		//
		//	Convey("This account Should be has not any follow account,and unfollow successfully  ", func() {
		//
		//		So(err, ShouldBeNil)
		//		So(result, ShouldNotBeNil)
		//
		//		So(err1, ShouldBeNil)
		//		So(result1, ShouldNotBeNil)
		//
		//		So(err2, ShouldBeNil)
		//		So(result2, ShouldBeNil)
		//	})
		//
		//})

		Convey("Request a friend by TusoId then to reject this request", func() {

			result, err := m.RequestFriendByTusoID(user4, user5.TusoID.String)

			m.User = user4
			result1, err1 := m.GetFollowee(&QueryParameter{})
			m.User = user5
			result2, err2 := m.GetFollowers(&QueryParameter{})

			result3, err3 := m.RejectApplyFriend(user5, Str2UUID(user4.UUID))

			m.User = user4
			result4, err4 := m.GetFollowee(&QueryParameter{})
			m.User = user5
			result5, err5 := m.GetFollowers(&QueryParameter{})

			Convey("This account send a request for friend,but not a firend now .", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)

				So(err1, ShouldBeNil)
				So(result1, ShouldBeEmpty)

				So(err2, ShouldBeNil)
				So(result2, ShouldBeEmpty)

				So(err3, ShouldBeNil)
				So(result3, ShouldNotBeNil)

				So(err4, ShouldBeNil)
				So(result4, ShouldBeEmpty)

				So(err5, ShouldBeNil)
				So(result5, ShouldBeEmpty)
			})

		})

		Convey("Request a friend by TusoId then to accept this request", func() {

			result, err := m.RequestFriendByTusoID(user4, user5.TusoID.String)

			m.User = user4
			result1, err1 := m.GetFollowee(&QueryParameter{})
			m.User = user5
			result2, err2 := m.GetFollowers(&QueryParameter{})

			result3, err3 := m.AcceptApplyFriend(user5, Str2UUID(user4.UUID))

			m.User = user4
			result4, err4 := m.GetFollowee(&QueryParameter{})
			m.User = user5
			result5, err5 := m.GetFollowers(&QueryParameter{})

			Convey("This account send a request for friend and should become good friends", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)

				So(err1, ShouldBeNil)
				So(result1, ShouldBeEmpty)

				So(err2, ShouldBeNil)
				So(result2, ShouldBeEmpty)

				So(err3, ShouldBeNil)
				So(result3, ShouldNotBeNil)

				So(err4, ShouldBeNil)
				So(result4, ShouldBeEmpty)

				So(err5, ShouldBeNil)
				So(result5, ShouldBeEmpty)
			})

		})

		Convey("To end firend relationship", func() {

			result, err := m.RequestFriend(user4, user5.UUID)
			result1, err1 := m.AcceptApplyFriend(user5, Str2UUID(user4.UUID))
			result3, err3 := m.EndFriendship(user5, Str2UUID(user4.UUID))

			m.User = user4
			result4, err4 := m.GetFollowee(&QueryParameter{})
			m.User = user5
			result5, err5 := m.GetFollowers(&QueryParameter{})

			Convey("This account send a request for friend,but not a firend now .", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)

				So(err1, ShouldBeNil)
				So(result1, ShouldNotBeNil)

				So(err3, ShouldBeNil)
				So(result3, ShouldNotBeNil)

				So(err4, ShouldBeNil)
				So(result4, ShouldBeEmpty)

				So(err5, ShouldBeNil)
				So(result5, ShouldBeEmpty)
			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}
