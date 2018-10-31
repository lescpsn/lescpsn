// This file "user_test.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston_test

import (
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
	"time"
)

//TestUserGetInfo
func TestUserGetInfo(t *testing.T) {

	Convey("Setup and create user", t, func() {

		var (
			email1   = buildEmail()
			password = "123456"
			device   = "hohohoho"
		)

		suite := NewSuit()
		m := suite.M

		user1, err1 := m.RegisterByEmail(email1, password, device)
		user3, err3 := DCenter.GetUserByEmail(email1)

		fmt.Println(user1)

		Convey("Should be registed success ", func() {

			So(err1, ShouldBeNil)

			So(err3, ShouldBeNil)

			So(user1, ShouldNotBeNil)

			So(user3, ShouldNotBeNil)

		})

		Convey("To view a account info by self UUID ", func() {

			result, err := m.GetUser(user3, Str2UUID(user3.UUID))
			Convey("should be have some info about user3", func() {
				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(user3.UUID, ShouldEqual, user3.UUID)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestUserUpdateInfo
func TestUserUpdateInfo(t *testing.T) {

	Convey("Setup and create user", t, func() {

		var (
			email1   = buildEmail()
			password = "123456"
			device   = "hohohoho"
		)

		suite := NewSuit()
		m := suite.M

		user1, err1 := m.RegisterByEmail(email1, password, device)

		user3, err3 := DCenter.GetUserByEmail(email1)

		Convey("Should be registed success ", func() {

			So(err1, ShouldBeNil)

			So(err3, ShouldBeNil)

			So(user1, ShouldNotBeNil)

			So(user3, ShouldNotBeNil)

		})

		Convey("To update user info", func() {

			realName := "John"
			nickname := "Dog wang"
			birthday, err := time.Parse(time.RFC3339, "2015-09-15T14:00:12-00:00")

			location := Location{Country: "China", State: "GuLou", City: "NanJing", District: "ZhongShanLu road 19th"}
			gender := UserGenderFemale

			result, err := m.UpdateUser(user3, Str2UUID(user3.UUID), realName, nickname, &birthday, &location, gender)
			result4, err4 := DCenter.GetUserByUUID(user3.UUID)

			date, dateerr := time.Parse(time.RFC3339, result4.Birthday.String)

			Convey("should be update suucess", func() {
				So(err, ShouldBeNil)
				So(dateerr, ShouldBeNil)
				So(result, ShouldNotBeNil)

				So(err4, ShouldBeNil)
				So(result4, ShouldNotBeNil)
				So(result4.Nickname.String, ShouldEqual, nickname)
				So(result4.RealName.String, ShouldEqual, realName)
				So(date, ShouldEqual, birthday)
				So(result4.Location.String, ShouldEqual, location)
				So(result4.Gender, ShouldEqual, gender)

			})

			Convey("Get user list by nickname ", func() {

				m.User = result4
				result, err := m.GetUsersByNickName(nickname, &QueryParameter{})

				Convey("should be have some info about this user", func() {
					So(err, ShouldBeNil)
					So(result, ShouldNotBeNil)
					So(len(result), ShouldNotBeEmpty)
					So(len(result), ShouldBeGreaterThan, 0)
				})

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestUserRelationInfo
func TestUserRelationInfo(t *testing.T) {

	Convey("Setup and create user", t, func() {

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

		Convey("To build relation about users", func() {

			r1, err1 := DCenter.UpsertRelation(UserRelation{FromID: NewValidNullInt(user4.ID), ToID: NewValidNullInt(user5.ID), RelatedType: UserRelatedTypeFollowee}) // user1 关注user2
			r2, err2 := DCenter.UpsertRelation(UserRelation{FromID: NewValidNullInt(user5.ID), ToID: NewValidNullInt(user4.ID), RelatedType: UserRelatedTypeFollower}) // user2 被user1关注
			r3, err3 := DCenter.UpsertRelation(UserRelation{FromID: NewValidNullInt(user4.ID), ToID: NewValidNullInt(user6.ID), RelatedType: UserRelatedTypeFriend})   // user1 和 user3 是朋友关系
			r4, err4 := DCenter.UpsertRelation(UserRelation{FromID: NewValidNullInt(user6.ID), ToID: NewValidNullInt(user4.ID), RelatedType: UserRelatedTypeFriend})   // user3 和 user1 是朋友关系

			Convey("should be have some info about user[2]", func() {
				So(err1, ShouldBeNil)
				So(err2, ShouldBeNil)
				So(err3, ShouldBeNil)
				So(err4, ShouldBeNil)

				So(r1, ShouldNotBeNil)
				So(r2, ShouldNotBeNil)
				So(r3, ShouldNotBeNil)
				So(r4, ShouldNotBeNil)
			})

			Convey("Get Firends,Followee,Follower", func() {

				m.User = user4
				result1, err1 := m.GetFollowee(&QueryParameter{})
				m.User = user5
				result2, err2 := m.GetFollowers(&QueryParameter{})
				m.User = user6
				result3, err3 := m.GetFriends(&QueryParameter{})

				Convey("should be have some info about user[2]", func() {
					So(err1, ShouldBeNil)
					So(err2, ShouldBeNil)
					So(err3, ShouldBeNil)

					So(result1, ShouldNotBeNil)
					So(result2, ShouldNotBeNil)
					So(result3, ShouldNotBeNil)

					So(len(result1), ShouldNotBeEmpty)
					So(len(result1), ShouldBeGreaterThan, 0)

					So(len(result2), ShouldNotBeEmpty)
					So(len(result2), ShouldBeGreaterThan, 0)

					So(len(result3), ShouldNotBeEmpty)
					So(len(result3), ShouldBeGreaterThan, 0)

				})

			})

			Convey("To check user relation", func() {

				istrue1, err1 := DCenter.Paramount(user4.ID, user5.ID, UserRelatedTypeFollowee.ToString()) //true
				istrue2, err2 := DCenter.Paramount(user5.ID, user4.ID, UserRelatedTypeFollower.ToString()) //true
				istrue3, err3 := DCenter.Paramount(user4.ID, user6.ID, UserRelatedTypeFriend.ToString())   //true
				istrue4, err4 := DCenter.Paramount(user6.ID, user4.ID, UserRelatedTypeFriend.ToString())   //true
				istrue5, err5 := DCenter.Paramount(user5.ID, user6.ID, UserRelatedTypeFriend.ToString())   //false
				istrue6, err6 := DCenter.Paramount(user4.ID, user5.ID, UserRelatedTypeFriend.ToString())   //fasle

				Convey("should be have some info about user[2]", func() {
					So(err1, ShouldBeNil)
					So(err2, ShouldBeNil)
					So(err3, ShouldBeNil)
					So(err4, ShouldBeNil)
					So(err5, ShouldBeNil)
					So(err6, ShouldBeNil)

					So(istrue1, ShouldBeTrue)
					So(istrue2, ShouldBeTrue)
					So(istrue3, ShouldBeTrue)
					So(istrue4, ShouldBeTrue)

					So(istrue5, ShouldBeFalse)
					So(istrue6, ShouldBeFalse)

				})

			})

		})
		Reset(func() {

			suite.tearDown()

		})

	})

}
