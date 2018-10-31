package phoenix_test

import (
	"bitbucket.org/ngspace/mean/config"
	"bitbucket.org/ngspace/mean/dream"
	"bitbucket.org/ngspace/mean/log"
	"bitbucket.org/ngspace/mean/phoenix"
	"crypto/sha1"
	"fmt"
)

type UnitTestSuite struct {
	BaseController *phoenix.BaseController
}

func (u *UnitTestSuite) tearDown() {
	u.BaseController.DB.Exec(`
	DROP SCHEMA  public CASCADE;
	CREATE SCHEMA public;
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	`)
	dream.Commit(u.BaseController.DB)
	//dream.DropMongoDB(u.MeanController.MDB)
}

func NewSuit() *UnitTestSuite {
	config.LoadConfig("../mean-config.ini")
	logger := log.NewLogger()

	DB := dream.GetX(config.GetDreamConf(), logger)
	transaction := dream.Begin(DB)
	MeanController := &phoenix.BaseController{
		DB: transaction,
	}
	uts := &UnitTestSuite{
		BaseController: MeanController,
	}
	dream.SetUpDB(transaction)
	return uts
}

func (u *UnitTestSuite) NewAUserByPhone() *dream.User {
	password := []byte("123456")
	salt := dream.RandomString(32)
	saltPassword := append([]byte(salt), password...)
	h := sha1.New()
	h.Write([]byte(saltPassword))
	bs := fmt.Sprintf("%x", h.Sum(nil))
	user, _ := dream.NewMobileUser(u.BaseController.DB, buildMobileNo(), bs, salt)
	return user
}

func buildMobileNo() string {
	return "156" + dream.RandomNumber(8)
}

func buildEmail() string {
	return "test" + dream.RandomNumber(8) + "@test.com"
}
