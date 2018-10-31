package model_test

import (
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	"github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
	"time"
)

//TestClaimInvitation
func TestClaimInvitation(t *testing.T) {

	Convey("Setup and to test ClaimInvitation function", t, func() {

		suite := NewSuit()
		m := suite.M

		Convey("to call ClaimInvitation function", func() {

			iv := Invitation{}

			uuid := uuid.NewV1()

			tp := InvitationTypeInHouse

			result, err := iv.ClaimInvitation(m.MDB, uuid, tp)

			Convey("should be create successful.", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(result.Owner, ShouldEqual, uuid.String())
				So(result.Type, ShouldEqual, tp)
				So(result.AppliedCount, ShouldEqual, 0)
				So(result.Status, ShouldEqual, InvitationStatusActive)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestIncrementApplied
func TestIncrementApplied(t *testing.T) {

	Convey("Setup and to test IncrementApplied function", t, func() {

		suite := NewSuit()
		m := suite.M

		Convey("to call IncrementApplied function", func() {

			iv := Invitation{}

			uuid := uuid.NewV1()

			tp := InvitationTypeInHouse

			result, err := iv.ClaimInvitation(m.MDB, uuid, tp)

			ivn, err := FirstInvitation(m.MDB, result.Code)

			i := &Invitation{
				ID:           ivn.ID,
				Code:         ivn.Code,
				Owner:        ivn.Owner,
				AppliedCount: ivn.AppliedCount,
				Type:         ivn.Type,
				Status:       ivn.Status,
				Timestamp:    ivn.Timestamp,
			}

			result1, err1 := i.IncrementApplied(m.MDB)

			ivn2, err1 := FirstInvitation(m.MDB, result.Code)

			fmt.Println(ivn, result1, ivn2)

			fmt.Println(ivn.AppliedCount, result1.AppliedCount, ivn2.AppliedCount)

			Convey("should be increment 1 for AppliedCount", func() {

				So(err, ShouldBeNil)
				So(result, ShouldNotBeNil)
				So(err1, ShouldBeNil)
				So(result1, ShouldNotBeNil)
				So(ivn, ShouldNotBeNil)

				So(result.Owner, ShouldEqual, uuid.String())
				So(result.Type, ShouldEqual, tp)
				So(result.AppliedCount, ShouldEqual, 0)
				So(result.Status, ShouldEqual, InvitationStatusActive)

				So(result1.ID, ShouldEqual, ivn.ID)
				So(ivn2.AppliedCount, ShouldEqual, ivn.AppliedCount+1)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestTypeValidation
func TestTypeValidation(t *testing.T) {

	Convey("Setup and to test ValidateInvitation function", t, func() {

		Convey("to call TypeValidation function by InvitationTypeInHouse", func() {

			ti, _ := time.Parse(time.RFC822, "01 Jul 16 12:00 UTC")

			inv := &Invitation{
				Code:         string(RandomNumber(6)),
				Owner:        uuid.NewV1().String(),
				AppliedCount: 0,
				Type:         InvitationTypeInHouse,
				Status:       InvitationStatusActive,
				Timestamp:    ti,
			}

			result1 := inv.TypeValidation()

			inv.AppliedCount = 7
			t1, _ := time.Parse(time.RFC822, "01 May 16 12:00 UTC")
			inv.Timestamp = t1

			result2 := inv.TypeValidation()

			inv.AppliedCount = 5
			result3 := inv.TypeValidation()

			Convey("should be valid pass", func() {
				So(result1, ShouldBeFalse)
				So(result2, ShouldBeFalse)
				So(result3, ShouldBeTrue)
			})

		})

		Convey("to call TypeValidation function by InvitationTypeVisitor", func() {
			t, _ := time.Parse(time.RFC822, "30 May 16 12:00 UTC")
			inv := Invitation{
				Code:         string(RandomNumber(6)),
				Owner:        uuid.NewV1().String(),
				AppliedCount: 0,
				Type:         InvitationTypeVisitor,
				Status:       InvitationStatusActive,
				Timestamp:    t,
			}

			result1 := inv.TypeValidation()

			inv.AppliedCount = 2
			t1, _ := time.Parse(time.RFC822, "01 July 16 12:00 UTC")
			inv.Timestamp = t1

			result2 := inv.TypeValidation()

			inv.AppliedCount = 1

			result3 := inv.TypeValidation()

			Convey("should be valid pass", func() {

				So(result1, ShouldBeFalse)
				So(result2, ShouldBeFalse)
				So(result3, ShouldBeTrue)

			})

		})

		Convey("to call TypeValidation function by InvitationTypeTester", func() {

			t, _ := time.Parse(time.RFC822, "30 May 16 12:00 UTC")

			inv := Invitation{
				Code:         string(RandomNumber(6)),
				Owner:        uuid.NewV1().String(),
				AppliedCount: 0,
				Type:         InvitationTypeTester,
				Status:       InvitationStatusActive,
				Timestamp:    t,
			}

			result1 := inv.TypeValidation()

			inv.AppliedCount = 2
			t1, _ := time.Parse(time.RFC822, "01 July 16 12:00 UTC")
			inv.Timestamp = t1

			result2 := inv.TypeValidation()

			inv.AppliedCount = 1

			result3 := inv.TypeValidation()

			Convey("should be valid pass", func() {

				So(result1, ShouldBeFalse)
				So(result2, ShouldBeFalse)
				So(result3, ShouldBeTrue)
			})

		})

	})

}

//TestValidateInvitation
func TestValidateInvitation(t *testing.T) {

	Convey("Setup and to test ValidateInvitation function", t, func() {

		Convey("to call TypeValidation function by InvitationTypeInHouse", func() {
			code1 := string(RandomNumber(6))
			code2 := string(RandomNumber(6))
			t, _ := time.Parse(time.RFC822, "30 July 16 12:00 UTC")

			inv := Invitation{
				Code:         code1,
				Owner:        uuid.NewV1().String(),
				AppliedCount: 0,
				Type:         InvitationTypeInHouse,
				Status:       InvitationStatusActive,
				Timestamp:    t,
			}

			result1 := inv.ValidateInvitation(code2)

			inv.Status = InvitationStatusLimited

			result2 := inv.ValidateInvitation(code1)

			inv.Status = InvitationStatusActive

			result3 := inv.ValidateInvitation(code1)

			Convey("should be valid pass", func() {
				So(result1, ShouldBeFalse)
				So(result2, ShouldBeFalse)
				So(result3, ShouldBeTrue)

			})

		})

	})

}

//TestFirstInvitation
func TestFirstInvitation(t *testing.T) {

	Convey("Setup and to test FirstInvitation function", t, func() {

		suite := NewSuit()
		m := suite.M

		Convey("to call FirstInvitation function", func() {

			iv := Invitation{}

			uuid := uuid.NewV1()

			tp := InvitationTypeInHouse

			result, err := iv.ClaimInvitation(m.MDB, uuid, tp)
			ivn1, err1 := FirstInvitation(m.MDB, result.Code)
			ivn2, err2 := FirstInvitation(m.MDB, string(RandomNumber(6)))

			Convey("should be increment 1 for AppliedCount", func() {

				So(err, ShouldBeNil)
				So(err1, ShouldBeNil)
				So(err2, ShouldBeNil)

				So(result, ShouldNotBeNil)
				So(ivn1, ShouldNotBeNil)
				So(ivn1.Code, ShouldEqual, result.Code)
				So(ivn2, ShouldBeNil)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestInsertInvitedUser
func TestInsertInvitedUser(t *testing.T) {

	Convey("Setup and to test InsertInvitedUser function", t, func() {

		suite := NewSuit()
		m := suite.M

		Convey("to call InsertInvitedUser function", func() {

			uuid := uuid.NewV1()

			code := string(RandomNumber(6))

			err := InsertInvitedUser(m.MDB, uuid, code)

			Convey("should be insert success", func() {

				So(err, ShouldBeNil)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}

//TestFindInvitedUser
func TestFindInvitedUser(t *testing.T) {

	Convey("Setup and to test FindInvitedUser function", t, func() {

		suite := NewSuit()
		m := suite.M

		Convey("to call FindInvitedUser function", func() {

			uuid := uuid.NewV1()

			code := string(RandomNumber(6))

			err := InsertInvitedUser(m.MDB, uuid, code)

			result, err1 := FindInvitedUser(m.MDB, code)

			Convey("should be have some info about invitation info", func() {
				So(err, ShouldBeNil)
				So(err1, ShouldBeNil)
				So(result, ShouldNotBeEmpty)

			})

		})

		Reset(func() {

			suite.tearDown()

		})

	})

}
