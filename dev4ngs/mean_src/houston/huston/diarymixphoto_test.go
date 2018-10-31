// This file "diarymixphoto.go" is created by hengjun che at 2016/06/15
// Copyright Nanjing Negative Space Tech LLC. All rights reserved.
// Package models provides data model definition in Tuso project
package huston_test

import (
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

//TestUserGetInfo
func TestGetDiaryMixPhoto(t *testing.T) {

	Convey("Setup and create user", t, func() {

		//suite := NewSuit()
		ds, err1 := DCenter.FindPhotoByUUIDs([]string{"1a523d79-bc96-4e57-844d-6ca7855c4978", "7d425e14-3fef-44cc-a674-33f6c76ff698", "a271599e-9741-4ec7-ba5d-959e5580aa28"}, &PhotoEchoOption{FetchNote: true, FetchBasePhoto: true})

		fmt.Println(len(ds), ds)

		Convey("Should be registed success ", func() {

			So(err1, ShouldBeNil)

		})

	})

}
