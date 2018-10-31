package huston_test

import (
	. "git.ngs.tech/mean/houston/model"
	"github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
	"time"
)

func (d *HoustonTest) ComposeEchoPhotoLite() *Photo {
	return &Photo{
		UserUUID: uuid.NewV4().String(),
		RawPhoto: &BasePhoto{
			Width:        NewValidNullInt(100),
			Height:       NewValidNullInt(100),
			FileURL:      NewValidNullString("http://werrwer"),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     NewValidNullInt(100),
			PrimaryColor: NewValidNullString("http://werrwer"),
		},
		PhotoPrivacy: PhotoPrivacyPrivate,
		Identifier:   NewValidNullString("asdfjoiaejfq"),
		PrimaryColor: NewValidNullString("FFFFFF"),
	}
}

func (d *HoustonTest) ComposeEchoPhoto() *Photo {
	p := d.ComposeEchoPhotoLite()
	p.Width = NewValidNullInt(1024)
	p.Height = NewValidNullInt(720)
	p.FileUUID = uuid.NewV4().String()
	p.FileSize = NewValidNullInt(1000000)
	p.FileURL = NewValidNullString("http://sdfa")
	p.EditParam = NewValidNullString("{}")
	p.IsAvatar = NewValidNullBool(true)
	p.IsTuso = NewValidNullBool(false)

	return p
}

func (u *HoustonTest) AddPhoto(cu *User) *Photo {
	p := u.ComposeEchoPhoto()
	DCenter.NewPhoto(p, &PhotoEchoOption{})
	return p
}

func TestPhotoPrivacy(t *testing.T) {
	d := NewSuit()

	Convey("保存一张隐私图片", t, func() {
		u, err := DCenter.NewEmailUser(buildEmail(), "123456")
		Convey("先注册一个用户", func() {
			So(err, ShouldBeNil)
			So(u, ShouldNotBeNil)
		})

		p := d.ComposeEchoPhoto()
		p.UserUUID = u.UUID

		sPhoto, err := DCenter.NewPhoto(p, &PhotoEchoOption{})

		Convey("保存图片不应当出现问题", func() {
			So(err, ShouldBeNil)
			So(sPhoto, ShouldNotBeNil)
		})

		Convey("尝试调整图片隐私, 将其设为公开", func() {
			dungeons, err := d.M.PublicPhoto(u, sPhoto.UUID)

			Convey("调整图片隐私不应出现出服务器错误", func() {
				So(err, ShouldBeNil)
				So(dungeons[`id`].(int64), ShouldEqual, sPhoto.ID)
				So(dungeons[`privacy`].(string), ShouldEqual, `photo_privacy_public`)
			})

			Convey("尝试重新获取这张图片, 图片应为公开", func() {
				dungeons, err := d.M.GetPhotoDataByUUID(u, Str2UUID(sPhoto.UUID))

				Convey("获取图片不应出现服务器错误, 同时图片隐私应为公开", func() {
					So(err, ShouldBeNil)
					So(dungeons[`id`].(int64), ShouldEqual, sPhoto.ID)
					So(dungeons[`privacy`].(string), ShouldEqual, `photo_privacy_public`)
				})

			})
		})

		Convey("尝试调整图片隐私, 将其设为隐私", func() {
			dungeons, err := d.M.PrivatePhoto(u, sPhoto.UUID)

			Convey("调整图片隐私不应出现出服务器错误", func() {
				So(err, ShouldBeNil)
				So(dungeons[`id`].(int64), ShouldEqual, sPhoto.ID)
				So(dungeons[`privacy`].(string), ShouldEqual, `photo_privacy_private`)
			})

			Convey("尝试重新获取这张图片, 图片应为隐私", func() {
				dungeons, err := d.M.GetPhotoDataByUUID(u, Str2UUID(sPhoto.UUID))

				Convey("获取图片不应出现服务器错误, 同时图片隐私应为隐私", func() {
					So(err, ShouldBeNil)
					So(dungeons[`id`].(int64), ShouldEqual, sPhoto.ID)
					So(dungeons[`privacy`].(string), ShouldEqual, `photo_privacy_private`)
				})

			})

		})

	})
}

func TestPhotoIdentifier(t *testing.T) {
	d := NewSuit()

	Convey("保存一张隐私图片", t, func() {
		u, err := DCenter.NewEmailUser(buildEmail(), "123456")
		Convey("先注册一个用户", func() {
			So(err, ShouldBeNil)
			So(u, ShouldNotBeNil)
		})

		p := d.ComposeEchoPhoto()
		p.UserUUID = u.UUID

		Identifier := "wolegequ,cnmmmm" + uuid.NewV4().String()
		p.Identifier = NewValidNullString(Identifier)

		sPhoto, err := DCenter.NewPhoto(p, &PhotoEchoOption{})

		Convey("保存图片不应当出现问题", func() {
			So(err, ShouldBeNil)
			So(sPhoto, ShouldNotBeNil)
		})

		Convey("尝试调整通过 MD5 获取图片", func() {
			dungeons, err := d.M.PhotoMD5Duplication(u, Identifier)

			Convey("应当获取图片成功", func() {
				So(err, ShouldBeNil)
				So(dungeons[`validation`].(bool), ShouldEqual, false)
			})

		})

		Convey("尝试调整通过 不正确的 MD5 获取图片", func() {
			dungeons, err := d.M.PhotoMD5Duplication(u, Identifier+":)")

			Convey("应当获取图片失败", func() {
				So(err, ShouldBeNil)
				So(dungeons[`validation`].(bool), ShouldEqual, true)
			})

		})

	})
}

func TestNoteCreation(t *testing.T) {
	d := NewSuit()

	Convey("保存一张隐私图片", t, func() {
		u, err := DCenter.NewEmailUser(buildEmail(), "123456")
		Convey("先注册一个用户", func() {
			So(err, ShouldBeNil)
			So(u, ShouldNotBeNil)
		})

		p := d.ComposeEchoPhoto()
		p.UserUUID = u.UUID
		sPhoto, err := DCenter.NewPhoto(p, &PhotoEchoOption{})

		Convey("保存图片不应当出现问题", func() {
			So(err, ShouldBeNil)
			So(sPhoto, ShouldNotBeNil)
		})

		Convey("尝试使用图片用户添加随记", func() {
			dungeons, err := d.M.CreateNote(u, Str2UUID(sPhoto.UUID), "天气很号", "我也知道要你讲", "/1", time.Now())

			Convey("保存随记应当失败哦", func() {
				So(err, ShouldNotBeNil)
				So(dungeons, ShouldBeNil)
			})

		})

		Convey("尝试使用第二用户图片用户添加随记", func() {
			u1, err := DCenter.NewEmailUser(buildEmail(), "1234567")
			Convey("注册第二用户", func() {
				So(err, ShouldBeNil)
				So(u1, ShouldNotBeNil)
			})

			dungeons, err := d.M.CreateNote(u1, Str2UUID(sPhoto.UUID), "天气很号", "我也知道要你讲", "/1", time.Now())

			Convey("保存随记应当成功哦", func() {
				So(err, ShouldBeNil)
				So(dungeons, ShouldNotBeNil)

				Convey("随记细节应当一致", func() {
					n := dungeons[`note`].(Dungeons)
					So(n[`title`], ShouldEqual, "天气很号")
					So(n[`content`], ShouldEqual, "我也知道要你讲")
					So(n[`style`], ShouldEqual, "/1")
				})
			})

		})

	})
}
