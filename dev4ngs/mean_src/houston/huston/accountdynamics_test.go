// This file "user_test.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston_test

import (
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
)

//TestFindAccountDynamics
func TestFindAccountDynamics(t *testing.T) {

	Convey("Setup and to search info", t, func() {

		suite := NewSuit()
		m := suite.M

		Convey("to searh info", func() {

			D, err := m.FindAccountDynamics("a4eeed8f-bb31-4006-a28e-f923dc938899", "5771e5dd7b389a0c9ceb6865", "5771e5dd7b389a0c9ceb6860", DynamicsStatusUnread, 100)

			fmt.Println(D, err)

		})

		Reset(func() {

			//suite.tearDown()

		})

	})

}
