// This file "photo_test" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo_test

import (
	"git.ngs.tech/mean/dream/dream"
	"git.ngs.tech/mean/dream/echo"
	"github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

func (d *DreamTest) ComposeEchoPhotoLite() *echo.PhotoEcho {
	return &echo.PhotoEcho{
		UserUUID: uuid.NewV4().String(),
		RawPhoto: &echo.BasePhotoEcho{
			Width:        dream.NewValidNullInt(100),
			Height:       dream.NewValidNullInt(100),
			FileURL:      dream.NewValidNullString("http://werrwer"),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     dream.NewValidNullInt(100),
			PrimaryColor: dream.NewValidNullString("http://werrwer"),
		},
		PhotoPrivacy: dream.PhotoPrivacyPrivate,
		Identifier:   dream.NewValidNullString("asdfjoiaejfq"),
		PrimaryColor: dream.NewValidNullString("FFFFFF"),
	}
}

func (d *DreamTest) ComposeEchoPhoto() *echo.PhotoEcho {
	p := d.ComposeEchoPhotoLite()
	p.Width = dream.NewValidNullInt(1024)
	p.Height = dream.NewValidNullInt(720)
	p.FileUUID = uuid.NewV4().String()
	p.FileSize = dream.NewValidNullInt(1000000)
	p.FileURL = dream.NewValidNullString("http://sdfa")
	p.EditParam = dream.NewValidNullString("{}")
	p.IsAvatar = dream.NewValidNullBool(true)
	p.IsTuso = dream.NewValidNullBool(false)

	return p
}

func TestNewPhoto(t *testing.T) {
	d := SetupTest()

	Convey("Given a PhotoEcho struct", t, func() {
		user, err := d.D.NewEmailUser("dfa@1.com", "12331231312", nil)
		So(err, ShouldBeNil)

		p := &echo.PhotoEcho{
			UserUUID: user.UUID,
			RawPhoto: &echo.BasePhotoEcho{
				Width:        dream.NewValidNullInt(100),
				Height:       dream.NewValidNullInt(100),
				FileURL:      dream.NewValidNullString("http://werrwer"),
				FileUUID:     uuid.NewV4().String(),
				FileSize:     dream.NewValidNullInt(100),
				PrimaryColor: dream.NewValidNullString("http://werrwer"),
			},
			PhotoPrivacy: dream.PhotoPrivacyPrivate,
			Width:        dream.NewValidNullInt(100),
			Height:       dream.NewValidNullInt(30),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     dream.NewValidNullInt(23),
			FileURL:      dream.NewValidNullString("http://werrwer"),
			Identifier:   dream.NewValidNullString("asdfjoiaejfq"),
			PrimaryColor: dream.NewValidNullString("FFFFFF"),
		}

		Convey("When save the struct", func() {
			pp, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(pp, ShouldNotBeNil)
		})

		Convey("remove RawPhoto and tries to resave struct as new entity", func() {
			p1 := *p
			p1.RawPhoto = nil

			pp, err := d.D.NewPhoto(&p1, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(pp, ShouldNotBeNil)
		})

		Convey("给 struct 添加 ID, 尝试将其保存为新的 struct", func() {
			p1 := *p
			p1.ID = 40

			pp, err := d.D.NewPhoto(&p1, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldNotBeNil)
			So(pp, ShouldBeNil)
		})
	})

	TearDownTest(d)
}

func TestUpdatePhoto(t *testing.T) {
	d := SetupTest()

	Convey("Given a PhotoEcho struct", t, func() {
		user, err := d.D.NewEmailUser("dfa@1.com", "12331231312", nil)
		So(err, ShouldBeNil)

		p := &echo.PhotoEcho{
			UserUUID: user.UUID,
			RawPhoto: &echo.BasePhotoEcho{
				Width:        dream.NewValidNullInt(100),
				Height:       dream.NewValidNullInt(100),
				FileURL:      dream.NewValidNullString("http://werrwer"),
				FileUUID:     uuid.NewV4().String(),
				FileSize:     dream.NewValidNullInt(100),
				PrimaryColor: dream.NewValidNullString("http://werrwer"),
			},
			PhotoPrivacy: dream.PhotoPrivacyPrivate,
			Width:        dream.NewValidNullInt(100),
			Height:       dream.NewValidNullInt(30),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     dream.NewValidNullInt(23),
			FileURL:      dream.NewValidNullString("http://werrwer"),
			Identifier:   dream.NewValidNullString("asdfjoiaejfq"),
			PrimaryColor: dream.NewValidNullString("FFFFFF"),
		}

		Convey("将一些字段改变, 然后尝试保存", func() {
			p, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p, ShouldNotBeNil)

			p.PhotoPrivacy = dream.PhotoPrivacyPublic
			p.Identifier = dream.NewValidNullString("31249032fdfd4532545")

			ppf, err := d.D.PatchPhotoByID(p.ID, p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(ppf, ShouldNotBeNil)

			So(p.ID, ShouldEqual, ppf.ID)
			So(p.UUID, ShouldEqual, ppf.UUID)
			So(p.PrimaryColor.String, ShouldEqual, ppf.PrimaryColor.String)

			So(ppf.Identifier.String, ShouldEqual, "31249032fdfd4532545")
		})

		Convey("将一些字段改变, 然后尝试 通过 UUID 保存", func() {
			p0 := d.ComposeEchoPhoto()
			p0.UserUUID = user.UUID

			p1, err := d.D.NewPhoto(p0, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p1, ShouldNotBeNil)
			So(p1.UUID, ShouldNotEqual, uuid.Nil)

			p1.PhotoPrivacy = dream.PhotoPrivacyPublic
			p1.Identifier = dream.NewValidNullString("lincanlincanlincanlincanlincanlincan")

			p2, err := d.D.PatchPhotoByUUID(p1.UUID, p1, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p2, ShouldNotBeNil)

			So(p2.ID, ShouldEqual, p1.ID)
			So(p2.UUID, ShouldEqual, p1.UUID)
			So(p2.PrimaryColor.String, ShouldEqual, p1.PrimaryColor.String)

			So(p2.Identifier.String, ShouldEqual, "lincanlincanlincanlincanlincanlincan")
		})

		Convey("将一些 Display Version 字段改变 然后保存", func() {
			p0, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p0, ShouldNotBeNil)

			p0.Width = dream.NewValidNullInt(1344)
			p0.Height = dream.NewValidNullInt(3445)

			p1, err := d.D.PatchDisplayPhotoByUUID(p0.UUID, p0.DisplayVersion.Int64, p0, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p1, ShouldNotBeNil)

			So(p1.ID, ShouldEqual, p0.ID)
			So(p1.UUID, ShouldEqual, p0.UUID)
			So(p1.Width.Int64, ShouldEqual, p0.Width.Int64)
			So(p1.Height.Int64, ShouldEqual, p0.Height.Int64)
		})

		Convey("只修改某些字段, 尝试有限更新", func() {
			p, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p, ShouldNotBeNil)

			p0 := &echo.PhotoEcho{
				Identifier: dream.NewValidNullString("312490weew324532545"),
			}

			ppf, err := d.D.PatchPhotoByID(p.ID, p0, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(ppf, ShouldNotBeNil)

			So(p.ID, ShouldEqual, ppf.ID)
			So(p.UUID, ShouldEqual, ppf.UUID)
			So(p.PrimaryColor.String, ShouldEqual, ppf.PrimaryColor.String)

			So(ppf.Identifier.String, ShouldEqual, "312490weew324532545")
		})

	})

	TearDownTest(d)
}

func TestDeletePhoto(t *testing.T) {
	d := SetupTest()

	Convey("Given a PhotoEcho struct", t, func() {
		user, err := d.D.NewEmailUser("dfa@1.com", "12331231312", nil)
		So(err, ShouldBeNil)

		p := &echo.PhotoEcho{
			UserUUID: user.UUID,
			RawPhoto: &echo.BasePhotoEcho{
				Width:        dream.NewValidNullInt(100),
				Height:       dream.NewValidNullInt(100),
				FileURL:      dream.NewValidNullString("http://werrwer"),
				FileUUID:     uuid.NewV4().String(),
				FileSize:     dream.NewValidNullInt(100),
				PrimaryColor: dream.NewValidNullString("http://werrwer"),
			},
			PhotoPrivacy: dream.PhotoPrivacyPrivate,
			Width:        dream.NewValidNullInt(100),
			Height:       dream.NewValidNullInt(30),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     dream.NewValidNullInt(23),
			FileURL:      dream.NewValidNullString("http://werrwer"),
			Identifier:   dream.NewValidNullString("asdfjoiaejfq"),
			PrimaryColor: dream.NewValidNullString("FFFFFF"),
		}

		Convey("保存一张照片, 然后通过 ID 将其删除", func() {
			p, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p, ShouldNotBeNil)

			ppf, err := d.D.DeletePhotoByID(p.ID, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(ppf, ShouldNotBeNil)

			p3, err := d.D.FirstPhotoByID(p.ID, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p3, ShouldBeNil)
		})

		Convey("保存一张照片, 然后通过 UUID 将其删除", func() {
			p, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p, ShouldNotBeNil)

			ppf, err := d.D.DeletePhotoByID(p.ID, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(ppf, ShouldNotBeNil)

			p3, err := d.D.FirstPhotoByUUID(p.UUID, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p3, ShouldBeNil)
		})
	})

	TearDownTest(d)
}

func TestUpgradePhoto(t *testing.T) {
	d := SetupTest()

	Convey("Given a PhotoEcho struct", t, func() {
		user, err := d.D.NewEmailUser("dfa@1.com", "12331231312", nil)
		So(err, ShouldBeNil)

		p := &echo.PhotoEcho{
			UserUUID: user.UUID,
			RawPhoto: &echo.BasePhotoEcho{
				Width:        dream.NewValidNullInt(100),
				Height:       dream.NewValidNullInt(100),
				FileURL:      dream.NewValidNullString("http://werrwer"),
				FileUUID:     uuid.NewV4().String(),
				FileSize:     dream.NewValidNullInt(100),
				PrimaryColor: dream.NewValidNullString("http://werrwer"),
			},
			PhotoPrivacy: dream.PhotoPrivacyPrivate,
			Width:        dream.NewValidNullInt(100),
			Height:       dream.NewValidNullInt(30),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     dream.NewValidNullInt(23),
			FileURL:      dream.NewValidNullString("http://werrwer"),
			Identifier:   dream.NewValidNullString("smile"),
			PrimaryColor: dream.NewValidNullString("FFFFFF"),
		}

		Convey("保存一张照片, 然后将其升级", func() {
			p0, err := d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p0, ShouldNotBeNil)

			p1 := &echo.PhotoEcho{
				UserUUID:     user.UUID,
				Width:        dream.NewValidNullInt(1000),
				Height:       dream.NewValidNullInt(300),
				FileUUID:     uuid.NewV4().String(),
				FileSize:     dream.NewValidNullInt(203),
				FileURL:      dream.NewValidNullString("http://afdsfdasdf"),
				PrimaryColor: dream.NewValidNullString("FFFFFF"),
			}

			ppf, err := d.D.UpgradePhotoByID(p0.ID, p1, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(ppf, ShouldNotBeNil)
			So(ppf.ID, ShouldEqual, p0.ID)
			So(ppf.DisplayVersion.Int64, ShouldEqual, 2)

			p3, err := d.D.FirstPhotoByID(p0.ID, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p3, ShouldNotBeNil)
			So(p3.ID, ShouldEqual, p0.ID)
			So(p3.Width.Int64, ShouldEqual, 1000)
		})

	})

	TearDownTest(d)
}

func TestFindPhoto(t *testing.T) {
	d := SetupTest()

	Convey("创建 p0 - p1, 并统一其 UserUUID", t, func() {
		user, err := d.D.NewEmailUser("dfa@1.com", "12331231312", nil)
		So(err, ShouldBeNil)

		uUUID := user.UUID

		p0 := d.ComposeEchoPhoto()
		p0.UserUUID = uUUID

		p1 := d.ComposeEchoPhoto()
		p1.UserUUID = uUUID

		p2 := d.ComposeEchoPhoto()
		p2.UserUUID = uUUID

		p3 := d.ComposeEchoPhoto()
		p3.UserUUID = uUUID

		p4 := d.ComposeEchoPhoto()
		p4.UserUUID = uUUID

		p5 := d.ComposeEchoPhoto()
		p5.UserUUID = uUUID

		p6 := d.ComposeEchoPhoto()
		p6.UserUUID = uUUID

		p7 := d.ComposeEchoPhoto()
		p7.UserUUID = uUUID

		Convey("将其保存, 然后通过 UserUUID 取出", func() {
			p0, err := d.D.NewPhoto(p0, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p0, ShouldNotBeNil)

			p1, err := d.D.NewPhoto(p1, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p1, ShouldNotBeNil)

			p2, err := d.D.NewPhoto(p2, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p2, ShouldNotBeNil)

			p3, err := d.D.NewPhoto(p3, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p3, ShouldNotBeNil)

			p4, err := d.D.NewPhoto(p4, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p4, ShouldNotBeNil)

			p5, err := d.D.NewPhoto(p5, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p5, ShouldNotBeNil)

			p6, err := d.D.NewPhoto(p6, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p6, ShouldNotBeNil)

			p7, err := d.D.NewPhoto(p7, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(p7, ShouldNotBeNil)

			ps, err := d.D.FindPhotosByUserUUID(uUUID, &dream.QueryParameter{}, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(len(ps), ShouldEqual, 8)
		})

		Convey("通过 UUIDs 将其取出", func() {
			var UUIDStrings []string
			var IDs []int64

			p0, err := d.D.NewPhoto(p0, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p0.UUID)
			IDs = append(IDs, p0.ID)

			p1, err := d.D.NewPhoto(p1, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p1.UUID)
			IDs = append(IDs, p1.ID)

			p2, err := d.D.NewPhoto(p2, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p2.UUID)
			IDs = append(IDs, p2.ID)

			p3, err := d.D.NewPhoto(p3, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p3.UUID)
			IDs = append(IDs, p3.ID)

			p4, err := d.D.NewPhoto(p4, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p4.UUID)
			IDs = append(IDs, p4.ID)

			p5, err := d.D.NewPhoto(p5, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p5.UUID)
			IDs = append(IDs, p5.ID)

			p6, err := d.D.NewPhoto(p6, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p6.UUID)
			IDs = append(IDs, p6.ID)

			p7, err := d.D.NewPhoto(p7, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			UUIDStrings = append(UUIDStrings, p7.UUID)
			IDs = append(IDs, p7.ID)

			ps1, err := d.D.FindPhotoByUUIDs(UUIDStrings, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(len(ps1), ShouldEqual, 8)

			ps2, err := d.D.FindPhotoByIDs(IDs, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)
			So(err, ShouldBeNil)
			So(len(ps2), ShouldEqual, 8)
		})

	})

	TearDownTest(d)
}
