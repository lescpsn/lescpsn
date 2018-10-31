// This file "file_test.go" is created by Lincan Li at 5/9/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo_test

import (
	"git.ngs.tech/mean/dream/dream"
	"git.ngs.tech/mean/dream/echo"
	"github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

func (d *DreamTest) ComposeEchoFile() *echo.FileEcho {
	return &echo.FileEcho{
		UserUUID: uuid.NewV4().String(),
		Bucket:   dream.NewValidNullString("tuso"),
		Key:      dream.NewValidNullString(uuid.NewV4().String()),
		Size:     dream.NewValidNullInt(100),
	}
}

func TestNewFile(t *testing.T) {
	d := SetupTest()

	Convey("给予一个新的 File Struct", t, func() {
		f := d.ComposeEchoFile()

		Convey("当保存本 File 时", func() {
			f1, err := d.D.NewFile(f, nil)
			So(err, ShouldBeNil)
			So(f1, ShouldNotBeNil)
		})

		Convey("给保存后的 struct 添加 ID, 尝试将其保存为新的 struct", func() {
			f1, err := d.D.NewFile(f, nil)
			So(err, ShouldBeNil)
			So(f1, ShouldNotBeNil)

			f2 := *f1
			f2.ID = 40

			f3, err := d.D.NewFile(&f2, nil)
			So(err, ShouldNotBeNil)
			So(f3, ShouldBeNil)
		})
	})

	TearDownTest(d)
}

func TestUpdateFile(t *testing.T) {
	d := SetupTest()

	Convey("给予一个新的 File Struct", t, func() {
		f := d.ComposeEchoFile()

		Convey("当保存本 File 后, 修改一些字段然后更新", func() {
			f1, err := d.D.NewFile(f, nil)
			So(err, ShouldBeNil)
			So(f1, ShouldNotBeNil)

			f1.Bucket = dream.NewValidNullString("apple")
			f2, err := d.D.UpdateFileByID(f1.ID, f1, nil)
			So(err, ShouldBeNil)
			So(f2, ShouldNotBeNil)
			So(f2.Bucket.String, ShouldEqual, "apple")
		})
	})

	TearDownTest(d)
}
