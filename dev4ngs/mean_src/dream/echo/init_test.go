// This file "init_test" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo_test

import (
	"encoding/json"
	"git.ngs.tech/mean/dream/config"
	"git.ngs.tech/mean/dream/dream"
	"git.ngs.tech/mean/dream/echo"
)

type DreamTest struct {
	D echo.Dream
}

func SetupTest() *DreamTest {
	d := &DreamTest{D: echo.Dream{}}

	config.LoadConfig("../mean-config.ini")

	RDB := dream.GetX(config.GetDreamConf())
	d.D.RDB = dream.Begin(RDB)

	dream.SetUpDB(d.D.RDB)
	//d.D.RDB.LogMode(true)
	return d
}

func TearDownTest(d *DreamTest) {
	d.D.RDB.Exec(`
	DROP SCHEMA  public CASCADE;
	CREATE SCHEMA public;
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	`)

	dream.Commit(d.D.RDB)
}

func LogJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func buildEmail() string {
	return "test" + dream.RandomNumber(8) + "@test.com"
}

func buildMobileNo() string {
	return "156" + dream.RandomNumber(8)
}
