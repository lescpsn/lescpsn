package huston_test

import (
	"git.ngs.tech/mean/houston/config"
	"git.ngs.tech/mean/houston/huston"
	"git.ngs.tech/mean/houston/log"
	. "git.ngs.tech/mean/houston/model"
	"testing"
)

func TestMain(m *testing.M) {
	ConnectDream()
	m.Run()
}

type HoustonTest struct {
	M *huston.MeanController
}

func (u *HoustonTest) tearDown() {
	DCenter.TearDownSchema()
}

func NewSuit() *HoustonTest {
	config.LoadConfig("../mean-config.ini")
	logger := log.NewLogger()

	DB := GetX(config.GetDreamConf(), logger)
	transaction := Begin(DB)
	_, MDB := GetMDBAndMSession(config.GetMongoConf())
	MeanController := &huston.MeanController{
		RDB: transaction,
		MDB: MDB,
	}
	uts := &HoustonTest{
		M: MeanController,
	}
	DCenter.CreateSchema()
	return uts
}

func (u *HoustonTest) NewAUserWithMobile() *User {
	password := "123456"
	user, _ := DCenter.NewMobileUser(buildMobileNo(), password)
	return user
}

func (u *HoustonTest) NewAUserWithEmail() *User {
	password := "123456"
	user, _ := DCenter.NewEmailUser(buildEmail(), password)
	return user
}

func buildMobileNo() string {
	return "156" + RandomNumber(8)
}

func buildEmail() string {
	return "test" + RandomNumber(8) + "@test.com"
}
