// This file "user_test.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston_test

import (
	"encoding/json"
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	dream "git.ngs.tech/mean/proto"
	"github.com/micro/go-micro/client"
	. "github.com/smartystreets/goconvey/convey"
	"golang.org/x/net/context"
	"strconv"
	"testing"
	"time"
)

//TestNewDiary
func TestNewDiary(t *testing.T) {

	Convey("Setup and create New Diary", t, func() {

		dy := Diary{
			UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    strconv.FormatInt(time.Now().Unix(), 10),
		}

		suite := NewSuit()
		m := suite.M

		Convey("to create Diary", func() {

			D, err := m.NewDiary(&dy)

			relsut, _ := json.Marshal(D)

			fmt.Println(string(relsut), dy.Timestamp)

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldNotEqual, "")

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestUpdateDiaryByID
func TestUpdateDiaryByID(t *testing.T) {

	Convey("Setup and create Diary", t, func() {

		dy := Diary{
			UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		suite := NewSuit()
		m := suite.M
		model := &Diary{}
		model.UserUUID = dy.UserUUID

		D, err := m.NewDiary(&dy)
		model.ID = D[`id`].(int64)
		model.UUID = D[`uuid`].(string)

		Convey("to create Diary", func() {

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldNotEqual, "")

			})

		})

		Convey("to update Diary by id", func() {

			dy1 := Diary{
				UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
				DiaryPrivacy: DiaryPrivacyPrivate,
				Title:        NewValidNullString("这是标题1"),
				Content:      NewValidNullString("这是内容1"),
				Style:        NewValidNullString("这是样式1"),
				Timestamp:    "2016-5-26",
			}

			d2, err := m.UpdateDiaryByID(model.ID, &dy1)

			Convey("Should be updated success ", func() {

				So(err, ShouldBeNil)
				So(d2, ShouldNotBeNil)
				So(d2[`id`], ShouldEqual, model.ID)
				So(d2[`title`], ShouldEqual, dy1.Title.String)
				So(d2[`content`], ShouldEqual, dy1.Content.String)
				So(d2[`style`], ShouldEqual, dy1.Style.String)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestPatchDiaryByID
func TestPatchDiaryByID(t *testing.T) {

	Convey("Setup and create Diary", t, func() {
		dy := Diary{
			UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		suite := NewSuit()
		m := suite.M
		model := Diary{}
		model.UserUUID = dy.UserUUID

		Convey("to Patch Diary by id", func() {

			D, err := m.NewDiary(&dy)
			model.ID = D[`id`].(int64)
			model.UUID = D[`uuid`].(string)

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldNotEqual, "")

			})

		})

		Convey("to update Diary by id", func() {

			dy1 := Diary{
				DiaryPrivacy: DiaryPrivacyPublic,
				Title:        NewValidNullString("这是标题1"),
				Content:      NewValidNullString("这是内容1"),
			}

			D, err := m.UpdateDiaryByID(model.ID, &dy1)

			Convey("Should be updated success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`id`], ShouldEqual, model.ID)
				So(D[`title`], ShouldEqual, dy1.Title.String)
				So(D[`content`], ShouldEqual, dy1.Content.String)
				So(D[`diary_privacy`], ShouldEqual, dy1.DiaryPrivacy)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestDeleteDiaryByID
func TestDeleteDiaryByID(t *testing.T) {

	Convey("Setup and create Diary", t, func() {
		dy := Diary{
			UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		suite := NewSuit()
		m := suite.M
		model := Diary{}
		model.UserUUID = dy.UserUUID

		Convey("to create Diary", func() {

			D, err := m.NewDiary(&dy)
			model.ID = D[`id`].(int64)
			model.UUID = D[`uuid`].(string)

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldNotEqual, "")

			})

		})

		Convey("to delete Diary by id", func() {

			D, err := m.DeleteDiaryByID(model.ID)

			Convey("Should be deleted success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestDeleteDiaryByUUID
func TestDeleteDiaryByUUID(t *testing.T) {

	Convey("Setup and create Diary", t, func() {
		dy := Diary{
			UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		suite := NewSuit()
		m := suite.M
		model := Diary{}
		model.UserUUID = dy.UserUUID

		Convey("to create Diary", func() {

			D, err := m.NewDiary(&dy)
			model.ID = D[`id`].(int64)
			model.UUID = D[`uuid`].(string)

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldNotEqual, "")

			})

		})

		Convey("to delete Diary by UUid", func() {

			D, err := m.DeleteDiaryByUUID(model.UUID)

			Convey("Should be deleted success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//FindDiaryByUserID
func FindDiaryByUserID(t *testing.T) {

	Convey("Setup and create Diary", t, func() {
		var (
			email1   = buildEmail()
			password = "123456"
			device   = "hohohoho"
		)

		suite := NewSuit()
		m := suite.M

		user1, err1 := m.RegisterByEmail(email1, password, device)
		cl := dream.NewDreamServicesClient("go.micro.srv.greeter", client.DefaultClient)
		rsp, err3 := cl.GetUserByEmail(context.TODO(), &dream.GetUserByEmailRequest{
			Email: email1,
		})
		user3 := rsp.User

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

		dy := Diary{
			UserUUID:     user3.UUID,
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		model := Diary{}
		model.UserUUID = dy.UserUUID

		Convey("to create Diary", func() {

			D, err := m.NewDiary(&dy)
			model.ID = D[`id`].(int64)
			model.UUID = D[`uuid`].(string)

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldEqual, dy.UUID)

			})

		})

		Convey("get account by uuid and query diary by user uuid", func() {

			D, err := m.FindDiaryByUserID(user3.ID, &QueryParameter{})

			Convey("Should be have some info about user3 ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(len(D), ShouldEqual, 1)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//FindDiaryByUserUUID
func FindDiaryByUserUUID(t *testing.T) {

	Convey("Setup and create Diary", t, func() {
		var (
			email1   = buildEmail()
			password = "123456"
			device   = "hohohoho"
		)

		suite := NewSuit()
		m := suite.M

		user1, err1 := m.RegisterByEmail(email1, password, device)
		cl := dream.NewDreamServicesClient("go.micro.srv.greeter", client.DefaultClient)
		rsp, err3 := cl.GetUserByEmail(context.TODO(), &dream.GetUserByEmailRequest{
			Email: email1,
		})
		user3 := rsp.User

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

		dy := Diary{
			UserUUID:     user3.UUID,
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		model := Diary{}
		model.UserUUID = dy.UserUUID

		Convey("to create Diary", func() {

			D, err := m.NewDiary(&dy)
			model.ID = D[`id`].(int64)
			model.UUID = D[`uuid`].(string)

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldEqual, dy.UUID)

			})

		})

		Convey("get account by uuid and query diary by user uuid", func() {

			D, err := m.FindDiaryByUserUUID(user3.UUID, &QueryParameter{})

			Convey("Should be have some info about user3 ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(len(D), ShouldEqual, 1)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestGetDiaryByIDAndUUID
func TestGetDiaryByIDAndUUID(t *testing.T) {

	Convey("Setup and create New Diary", t, func() {
		dy := Diary{
			UserUUID:     "71db1dfb-43a2-4533-8ad5-601d9619214e",
			DiaryPrivacy: DiaryPrivacyPrivate,
			Title:        NewValidNullString("这是标题"),
			Content:      NewValidNullString("这是内容"),
			Style:        NewValidNullString("这是样式"),
			Timestamp:    "2016-5-26",
		}

		suite := NewSuit()
		m := suite.M
		model := Diary{}
		model.UserUUID = dy.UserUUID
		D, err := m.NewDiary(&dy)
		model.ID = D[`id`].(int64)
		model.UUID = D[`uuid`].(string)

		Convey("to create Diary", func() {

			Convey("Should be create success ", func() {

				So(err, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D[`uuid`], ShouldNotEqual, "")

			})

		})

		Convey("to query Diary by id", func() {

			D, err := m.GetDiaryByID(model.ID)
			D1, err1 := m.GetDiaryByUUID(model.UUID)
			Ds, err2 := m.GetDiaryByIDs([]int64{model.ID})
			Ds1, err3 := m.GetDiaryByUUIDs([]string{model.UUID})

			Convey("Should be have some info about this account", func() {

				So(err, ShouldBeNil)
				So(err1, ShouldBeNil)
				So(err2, ShouldBeNil)
				So(err3, ShouldBeNil)
				So(D, ShouldNotBeNil)
				So(D1, ShouldNotBeNil)
				So(Ds, ShouldNotBeNil)
				So(Ds1, ShouldNotBeNil)

				So(D[`uuid`], ShouldEqual, model.UUID)
				So(D1[`uuid`], ShouldEqual, model.UUID)

				So(len(Ds), ShouldEqual, 1)
				So(len(Ds1), ShouldEqual, 1)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}
