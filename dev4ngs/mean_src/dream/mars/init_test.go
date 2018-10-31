// This file "init_test" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars_test

import (
	"crypto/sha1"
	"fmt"
	"git.ngs.tech/mean/dream/config"
	"git.ngs.tech/mean/dream/dream"
	"github.com/jinzhu/gorm"
	"time"
)

type UnitTestSuite struct {
	X *gorm.DB
}

func NewSuit() *UnitTestSuite {
	config.LoadConfig("../mean-config.ini")

	DB := dream.GetX(config.GetDreamConf())
	transaction := dream.Begin(DB)
	//DB.LogMode(true)
	dream.SetUpDB(transaction)
	return &UnitTestSuite{
		X: transaction,
	}
}

func (s *UnitTestSuite) TearDown() {
	s.X.Exec(`
	DROP SCHEMA  public CASCADE;
	CREATE SCHEMA public;
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	`)
	dream.Commit(s.X)
	//dream.DropMongoDB(s.M)
}

func (u *UnitTestSuite) AddOnephoto(cu *dream.User) *dream.RawPhoto {
	var oi *dream.RawPhoto
	width, height := 100, 100
	pcv, ep, glv, md5, exif := "", "", "", "e10adc3949ba59abbe56e057f20f883e", "{}"
	bucket, eNKey, pID := "bucket", "eNKey", "1"
	timestamp := time.Now()

	p := dream.NewPhoto(cu, width, height, pcv, ep, timestamp)
	eFile := dream.NewPersistentFile(bucket, eNKey, pID, dream.PersistentTypeEditedPhoto)
	eFile.Save(u.X)

	p.SetImage(eFile).SetRawPhoto(oi).SetInInPipeLine(true).SetDisplayVersion(1)
	p.Save(u.X)
	oi = dream.NewRawPhoto(cu, dream.PhotoPrivacyPublic, width, height, pcv, glv, md5, exif, timestamp)
	oi.SetRawImage(eFile).SetLiteImage(eFile).SetDisplayVersion(1)
	oi.SetDisplayPhoto(p)
	oi.Save(u.X)
	return oi
}

func (u *UnitTestSuite) AddOneCommit(cu *dream.User, news *dream.News) *dream.Comment {
	content := "test"
	comment, _ := news.NewComment(u.X, cu, content, time.Now())
	return comment
}

func (u *UnitTestSuite) AddOneNews(user *dream.User, rps []*dream.RawPhoto) *dream.News {
	news, _ := dream.NewNews(u.X, user, rps, time.Now())
	news.Save(u.X)
	return news
}

func (u *UnitTestSuite) NewOneMobileUser() *dream.User {
	password := []byte("123456")
	salt := dream.RandomString(32)
	saltPassword := append([]byte(salt), password...)
	h := sha1.New()
	h.Write([]byte(saltPassword))
	bs := fmt.Sprintf("%x", h.Sum(nil))
	user, _ := dream.NewMobileUser(u.X, buildMobileNo(), bs, salt)
	return user
}

func buildMobileNo() string {
	return "156" + dream.RandomNumber(8)
}

func (u *UnitTestSuite) NewAUserWithEmail() *dream.User {
	password := []byte("123456")
	salt := dream.RandomString(32)
	saltPassword := append([]byte(salt), password...)
	h := sha1.New()
	h.Write([]byte(saltPassword))
	bs := fmt.Sprintf("%x", h.Sum(nil))
	user, _ := dream.NewEmailUser(u.X, buildEmail(), bs, salt)
	return user
}

func buildEmail() string {
	return "test" + dream.RandomNumber(8) + "@test.com"
}
