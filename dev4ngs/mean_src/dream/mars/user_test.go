package mars_test

import (
	"bitbucket.org/ngspace/mean/dream"
	"github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

//TestGenderConvertData
func TestGenderConvertData(t *testing.T) {

	Convey("To Convert data", t, func() {

		//Gender
		female := dream.UserGenderFemale
		male := dream.UserGenderMale

		//Gender to string
		femaleStr, err := female.ToString()
		maleStr, err1 := male.ToString()
		//String to Gender
		female, err2 := dream.SToGender(femaleStr)
		male, err3 := dream.SToGender(maleStr)

		Convey("Should be convert success", func() {
			So(err, ShouldBeNil)
			So(err1, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)

			So(femaleStr, ShouldEqual, "female")
			So(maleStr, ShouldEqual, "male")

			So(female, ShouldEqual, dream.UserGenderFemale)
			So(male, ShouldEqual, dream.UserGenderMale)

		})

	})

}

//TestUserRelationTypeConvertData
func TestUserRelationTypeConvertData(t *testing.T) {
	Convey("To Convert data", t, func() {
		//UserRelationType
		relatedTypeNone := dream.UserRelatedTypeNone
		relatedTypeFollowee := dream.UserRelatedTypeFollowee
		relatedTypeFollower := dream.UserRelatedTypeFollower
		relatedTypeMutualFollow := dream.UserRelatedTypeMutualFollow
		relatedTypeFriend := dream.UserRelatedTypeFriend

		//UserRelationType to string
		relatedTypeNoneStr := relatedTypeNone.ToString()
		relatedTypeFolloweeStr := relatedTypeFollowee.ToString()
		relatedTypeFollowerStr := relatedTypeFollower.ToString()
		relatedTypeMutualFollowStr := relatedTypeMutualFollow.ToString()
		relatedTypeFriendStr := relatedTypeFriend.ToString()

		//String to UserRelationType
		relatedTypeNone = dream.SToUserRelatedType(relatedTypeNoneStr)
		relatedTypeFollowee = dream.SToUserRelatedType(relatedTypeFolloweeStr)
		relatedTypeFollower = dream.SToUserRelatedType(relatedTypeFollowerStr)
		relatedTypeMutualFollow = dream.SToUserRelatedType(relatedTypeMutualFollowStr)
		relatedTypeFriend = dream.SToUserRelatedType(relatedTypeFriendStr)

		Convey("Should be convert success", func() {

			So(relatedTypeNoneStr, ShouldEqual, "related_type_none")
			So(relatedTypeFolloweeStr, ShouldEqual, "related_type_followee")
			So(relatedTypeFollowerStr, ShouldEqual, "related_type_follower")
			So(relatedTypeMutualFollowStr, ShouldEqual, "related_type_mutual_follow")
			So(relatedTypeFriendStr, ShouldEqual, "related_type_friend")

			So(relatedTypeNone, ShouldEqual, dream.UserRelatedTypeNone)
			So(relatedTypeFollowee, ShouldEqual, dream.UserRelatedTypeFollowee)
			So(relatedTypeFollower, ShouldEqual, dream.UserRelatedTypeFollower)
			So(relatedTypeMutualFollow, ShouldEqual, dream.UserRelatedTypeMutualFollow)
			So(relatedTypeFriend, ShouldEqual, dream.UserRelatedTypeFriend)
		})

	})

}

//TestUserStausConvertData
func TestUserStausConvertData(t *testing.T) {

	Convey("To Convert data", t, func() {
		//UserStaus
		statusActivated := dream.UserStatusActivated
		statusDeactivated := dream.UserStatusDeactivated
		statusClosed := dream.UserStatusClosed

		//UserStaus to String

		statusActivatedStr := statusActivated.ToString()
		statusDeactivatedStr := statusDeactivated.ToString()
		statusClosedStr := statusClosed.ToString()

		Convey("Should be convert success", func() {
			So(statusActivatedStr, ShouldEqual, "user_status_activated")
			So(statusDeactivatedStr, ShouldEqual, "user_status_deactivated")
			So(statusClosedStr, ShouldEqual, "user_status_closed")
		})

	})
}

//TestUserCreate
func TestUserCreate(t *testing.T) {

	Convey("To create a user", t, func() {
		s := NewSuit()
		user1 := s.NewOneMobileUser()
		user2 := s.NewAUserWithEmail()

		Convey("Should be create success", func() {
			So(user1, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
		})

		Reset(func() {
			s.TearDown()
		})
	})
}

//TestUserCreate
func TestUserSecrets(t *testing.T) {

	Convey("To create a user", t, func() {
		s := NewSuit()
		user1 := s.NewOneMobileUser()
		user2 := s.NewAUserWithEmail()

		Convey("Should be create success", func() {
			So(user1, ShouldNotBeNil)
			So(user2, ShouldNotBeNil)
		})

		Convey("Get Secrets and update it", func() {
			secretStr := user2.Secrets
			password := user1.Password
			s1, err1 := user1.GetSecrets()
			s2, err2 := user2.UpdateSecret(s.X)
			s3, err3 := user2.GetSecretByEmail(s.X, user2.Email)
			s4, err4 := user1.GetSecretByMobile(s.X, user1.PhoneNumber)
			s5, err5 := user1.ChangePassBySecret(s.X, "4321")

			Convey("Should be have some info about secret", func() {
				So(s1, ShouldNotBeNil)
				So(err1, ShouldBeNil)
				So(s3, ShouldNotBeNil)
				So(err3, ShouldBeNil)
				So(s4, ShouldNotBeNil)
				So(err4, ShouldBeNil)

				So(s5, ShouldNotBeNil)
				So(err5, ShouldBeNil)
				So(s5.Password, ShouldNotEqual, password)

			})

			Convey("Should be updated ", func() {
				So(s2, ShouldNotBeNil)
				So(err2, ShouldBeNil)
				So(secretStr, ShouldNotEqual, s2.Secrets)
			})

		})

		Reset(func() {
			s.TearDown()
		})
	})
}

//TestUserToDataWithTokenAndNuclearKey
func TestUserToDataWithTokenAndNuclearKey(t *testing.T) {

	Convey("To start", t, func() {
		s := NewSuit()
		user := s.NewOneMobileUser()
		result, err := user.ToDataWithTokenAndNuclearKey(s.X)

		Convey("To Data With Token And Nuclear Key", func() {
			So(err, ShouldBeNil)
			So(result, ShouldNotBeNil)
		})

		Reset(func() {
			s.TearDown()
		})
	})
}

//TestIncrement
func TestIncrement(t *testing.T) {

	Convey("Increment Test", t, func() {
		s := NewSuit()
		user := s.NewOneMobileUser()
		err1 := user.IncrementFollowees(s.X, 3)
		err2 := user.IncrementFollowers(s.X, 3)
		err3 := user.IncrementFriends(s.X, 3)
		err4 := user.IncrementImages(s.X, 3)
		err5 := user.IncrementTusos(s.X, 3)

		Convey("Should incrment success", func() {
			So(err1, ShouldBeNil)
			So(err2, ShouldBeNil)
			So(err3, ShouldBeNil)
			So(err4, ShouldBeNil)
			So(err5, ShouldBeNil)
		})

		Reset(func() {
			s.TearDown()
		})
	})
}

//TestGetUser
func TestGetUser(t *testing.T) {

	Convey("Increment Test", t, func() {
		s := NewSuit()
		muser := s.NewOneMobileUser()
		euser := s.NewAUserWithEmail()

		user1, err1 := dream.FirstUserByEmail(s.X, euser.Email)
		user2, err2 := dream.FirstUserByPhoneNumber(s.X, muser.PhoneNumber)
		user3, err3 := dream.FirstUserByUUID(s.X, muser.UUID)
		user4, err4 := dream.FirstUserByID(s.X, dream.Integer(muser.ID))

		user5, err5 := dream.FindUserByUUIDs(s.X, []uuid.UUID{muser.UUID, euser.UUID})
		opt := dream.QueryParameter{Count: 10, MaxID: 100000, Page: 1, SinceID: 0}
		user6, err6 := dream.FindUsersByNickName(s.X, muser.Nickname, &opt)
		db := dream.FindUsersByNickNameQuery(s.X, &opt)
		user7, err7 := dream.FirstUserByTusoID(s.X, muser.TusoId)
		user8, err8 := dream.FirstUserByToken(s.X, muser.Token)

		user9, err9 := dream.GetUsersByKeyword(s.X, euser.Email)

		Convey("Should be get user info", func() {

			So(err1, ShouldBeNil)
			So(user1, ShouldNotBeNil)

			So(err2, ShouldBeNil)
			So(user2, ShouldNotBeNil)

			So(err3, ShouldBeNil)
			So(user3, ShouldNotBeNil)

			So(err4, ShouldBeNil)
			So(user4, ShouldNotBeNil)

			So(err5, ShouldBeNil)
			So(user5, ShouldNotBeNil)

			So(err6, ShouldBeNil)
			So(user6, ShouldNotBeNil)

			So(err7, ShouldBeNil)
			So(user7, ShouldNotBeNil)

			So(err8, ShouldBeNil)
			So(user8, ShouldNotBeNil)

			So(err9, ShouldBeNil)
			So(user9, ShouldNotBeEmpty)

			So(db, ShouldNotBeNil)

		})

		Reset(func() {
			s.TearDown()
		})
	})
}

//TestUserRelation
func TestUserRelation(t *testing.T) {

	Convey("User relation test", t, func() {
		u := NewSuit()

		//1 关注 2 | 2 被关注 1  | 2 好友 3
		user1 := u.NewOneMobileUser()
		user2 := u.NewAUserWithEmail()
		user3 := u.NewAUserWithEmail()

		r1, er1 := user2.UpsertRelation(u.X, user1, dream.UserRelatedTypeFollower)
		r2, er2 := user1.UpsertRelation(u.X, user2, dream.UserRelatedTypeFollowee)
		r3, er3 := user2.UpsertRelation(u.X, user3, dream.UserRelatedTypeFriend)
		r4, er4 := user3.UpsertRelation(u.X, user2, dream.UserRelatedTypeFriend)

		t1, err1 := user2.Paramount(u.X, user1, dream.UserRelatedTypeFollower) //true
		t2, err2 := user1.Paramount(u.X, user2, dream.UserRelatedTypeFollower) //false
		t3, err3 := user2.Paramount(u.X, user3, dream.UserRelatedTypeFriend)   //true
		t4, err4 := user3.Paramount(u.X, user2, dream.UserRelatedTypeFriend)   //true

		Convey("Should be related each other", func() {

			So(er1, ShouldBeNil)
			So(r1, ShouldNotBeNil)

			So(er2, ShouldBeNil)
			So(r2, ShouldNotBeNil)

			So(er3, ShouldBeNil)
			So(r3, ShouldNotBeNil)

			So(er4, ShouldBeNil)
			So(r4, ShouldNotBeNil)

			So(err1, ShouldBeNil)
			So(t1, ShouldBeTrue)

			So(err2, ShouldBeNil)
			So(t2, ShouldBeFalse)

			So(err3, ShouldBeNil)
			So(t3, ShouldBeTrue)

			So(err4, ShouldBeNil)
			So(t4, ShouldBeTrue)

		})

		Convey("To get relation by user", func() {

			ur, err := user1.GetRelation(u.X, user2)

			Convey("should be have a right relation", func() {

				So(err, ShouldBeNil)
				So(ur, ShouldNotBeNil)
				So(ur.RelatedType, ShouldEqual, dream.UserRelatedTypeFollowee)
			})

		})

		Convey("To get relation type by user", func() {

			ur, err := user1.GetRelationType(u.X, user2)

			Convey("should be have a right relation Type", func() {

				So(err, ShouldBeNil)
				So(ur, ShouldNotBeNil)
				So(ur, ShouldEqual, dream.UserRelatedTypeFollowee)
			})

		})

		Reset(func() {
			u.TearDown()
		})
	})
}

//TestUserMakeFriend
func TestUserMakeFriend(t *testing.T) {

	Convey("User relation test", t, func() {
		u := NewSuit()
		user1 := u.NewOneMobileUser()
		user2 := u.NewAUserWithEmail()
		user3 := u.NewAUserWithEmail()

		Convey("To request make friend", func() {

			ur, err := user1.RequestFriend(u.X, user2)

			Convey("should not a friend relation", func() {

				So(err, ShouldBeNil)
				So(ur, ShouldNotBeNil)
				So(ur.RelatedType, ShouldNotEqual, dream.UserRelatedTypeFriend)
			})

		})

		Convey("To refuse a make friend request", func() {

			ur, err := user2.CleanFriendRequest(u.X, user1)

			Convey("use1 should be refused friend request", func() {

				So(err, ShouldBeNil)
				So(ur, ShouldNotBeNil)
				So(ur.RelatedType, ShouldNotEqual, dream.UserRelatedTypeFriend)
			})

		})

		Convey("To delete a user by uuid", func() {

			err := user3.Delete(u.X)

			Convey("use3 should be delete success", func() {

				So(err, ShouldBeNil)

			})

		})

		Convey("user1 make friend with user2", func() {

			ur, err := user1.MakeFriend(u.X, user2)

			Convey("use1 and user2 should be a friend", func() {

				So(err, ShouldBeNil)
				So(ur, ShouldNotBeNil)
				So(ur.RelatedType, ShouldEqual, dream.UserRelatedTypeFriend)
			})

		})

		Convey("user1 to terminate friendship with user2", func() {

			ur, err := user1.TerminateFriendship(u.X, user2)

			Convey("use1 and user2 should not a friend", func() {

				So(err, ShouldBeNil)
				So(ur, ShouldNotBeNil)
				So(ur.RelatedType, ShouldNotEqual, dream.UserRelatedTypeFriend)
			})

		})

		Convey("user1 make friend with user2 ,then to check realtion by user1", func() {

			//1 关注 2 | 2 被关注 1  | 2 好友 3
			r1, er1 := user2.UpsertRelation(u.X, user1, dream.UserRelatedTypeFollower)
			r2, er2 := user1.UpsertRelation(u.X, user2, dream.UserRelatedTypeFollowee)
			r3, er3 := user2.UpsertRelation(u.X, user3, dream.UserRelatedTypeFriend)
			r4, er4 := user3.UpsertRelation(u.X, user2, dream.UserRelatedTypeFriend)

			urs1, err1 := dream.GetFriends(u.X, user2)
			urs2, err2 := dream.GetFollowee(u.X, user1)
			urs3, err3 := dream.GetFollows(u.X, user2)
			urs4, err4 := dream.GetRelationByType(u.X, user1, dream.UserRelatedTypeFollowee)

			Convey("use1 and user2 should be a friend", func() {

				So(er1, ShouldBeNil)
				So(r1, ShouldNotBeNil)

				So(er2, ShouldBeNil)
				So(r2, ShouldNotBeNil)

				So(er3, ShouldBeNil)
				So(r3, ShouldNotBeNil)

				So(er4, ShouldBeNil)
				So(r4, ShouldNotBeNil)

				So(err1, ShouldBeNil)
				So(urs1, ShouldNotBeEmpty)

				So(err2, ShouldBeNil)
				So(urs2, ShouldNotBeEmpty)

				So(err3, ShouldBeNil)
				So(urs3, ShouldNotBeEmpty)

				So(err4, ShouldBeNil)
				So(urs4, ShouldNotBeEmpty)

			})

		})

		Reset(func() {
			u.TearDown()
		})

	})

}
