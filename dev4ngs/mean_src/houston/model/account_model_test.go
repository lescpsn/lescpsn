package model_test

import (
	. "git.ngs.tech/mean/houston/model"
	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/mgo.v2/bson"
	"testing"
	"time"
)

//TestNewSMSAccount
func TestNewSMSAccount(t *testing.T) {

	Convey("Setup and to test some function about account", t, func() {

		suite := NewSuit()
		m := suite.M
		mb := "15647506155"

		Convey("to call NewSMSAccount function", func() {

			result, err := NewSMSAccount(m.MDB, mb)

			result1, err1 := GetSMSAccountByPhoneNumber(m.MDB, mb)
			Convey("should be have some info about account.", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(result.PhoneNumber, ShouldEqual, mb)

			})

			Convey("should get data about account.", func() {

				So(err1, ShouldBeNil)
				So(result1, ShouldNotBeNil)
				So(result1.PhoneNumber, ShouldEqual, mb)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestNewSMSAccount
func TestUpdateCodeAndSecret(t *testing.T) {

	Convey("Setup and to test some function about account", t, func() {

		suite := NewSuit()
		m := suite.M
		mb := "15643722891"

		Convey("to call NewSMSAccount function", func() {

			result, err := NewSMSAccount(m.MDB, mb)

			Convey("should be have some info about account.", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(result.PhoneNumber, ShouldEqual, mb)
			})

		})

		Convey("to call UpdateCodeAndSecret function", func() {

			_, err := NewSMSAccount(m.MDB, mb)
			result, err := GetSMSAccountByPhoneNumber(m.MDB, mb)

			s := MobileAccount{
				ID:          result.ID,
				PhoneNumber: result.PhoneNumber,
				Code:        result.Code,
				Secret:      result.Secret,
				Timestamp:   result.Timestamp,
			}

			result1, err1 := s.UpdateCodeAndSecret(m.MDB)

			Convey("should be update successful.", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(err1, ShouldBeNil)
				So(result1, ShouldNotBeNil)
				So(result.PhoneNumber, ShouldEqual, mb)
				So(result.ID, ShouldEqual, result1.ID)
				So(result.Code, ShouldNotEqual, result1.Code)
				So(result.Secret, ShouldNotEqual, result1.Secret)
				So(result.Timestamp, ShouldNotEqual, result1.Timestamp)
			})

		})

		Convey("to call ValidateSecret function", func() {
			_, err := NewSMSAccount(m.MDB, mb)
			result, err := GetSMSAccountByPhoneNumber(m.MDB, mb)
			s := MobileAccount{
				ID:          result.ID,
				PhoneNumber: result.PhoneNumber,
				Code:        result.Code,
				Secret:      result.Secret,
				Timestamp:   result.Timestamp,
			}
			result1, err1 := s.UpdateCodeAndSecret(m.MDB)

			isValid1 := result1.ValidateSecret(result.Secret)

			isValid2 := result.ValidateSecret(result1.Secret)

			isValid3 := result.ValidateSecret(result.Secret)

			isValid4 := result1.ValidateSecret(result1.Secret)

			Convey("should be checked pass.", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(err1, ShouldBeNil)
				So(result1, ShouldNotBeNil)

				So(result.PhoneNumber, ShouldEqual, mb)
				So(result.ID, ShouldEqual, result1.ID)
				So(result.Code, ShouldNotEqual, result1.Code)
				So(result.Secret, ShouldNotEqual, result1.Secret)
				So(result.Timestamp, ShouldNotEqual, result1.Timestamp)

				So(isValid1, ShouldBeFalse)
				So(isValid2, ShouldBeFalse)
				So(isValid3, ShouldBeTrue)
				So(isValid4, ShouldBeTrue)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestNewSMSAccount
func TestSaveAndDeleteSMSAccount(t *testing.T) {

	Convey("Setup and to test some function about account", t, func() {

		suite := NewSuit()
		m := suite.M
		s := MobileAccount{
			ID:          bson.NewObjectId(),
			PhoneNumber: buildMobileNo(),
			Code:        RandomNumber(6),
			Secret:      RandomString(32),
			Timestamp:   time.Now(),
		}

		Convey("to call Save function of MobileAccount", func() {

			result1, err1 := GetSMSAccountByPhoneNumber(m.MDB, s.PhoneNumber)
			result2, err2 := s.Save(m.MDB)
			result3, err3 := GetSMSAccountByPhoneNumber(m.MDB, s.PhoneNumber)

			Convey("should be create successful.", func() {

				So(err1, ShouldBeNil)
				So(result1, ShouldBeNil)

				So(err2, ShouldBeNil)
				So(result2, ShouldNotBeNil)

				So(err3, ShouldBeNil)
				So(result3, ShouldNotBeNil)
			})

		})

		Convey("to call delete function of MobileAccount", func() {
			result, err := s.Save(m.MDB)
			result1, err1 := GetSMSAccountByPhoneNumber(m.MDB, s.PhoneNumber)
			s.ID = result1.ID
			result2, err2 := s.Delete(m.MDB)
			result3, err3 := GetSMSAccountByPhoneNumber(m.MDB, s.PhoneNumber)

			Convey("should be create successful.", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)

				So(err1, ShouldBeNil)
				So(result1, ShouldNotBeNil)

				So(err2, ShouldBeNil)
				So(result2, ShouldNotBeNil)

				So(err3, ShouldBeNil)
				So(result3, ShouldBeNil)
			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}
