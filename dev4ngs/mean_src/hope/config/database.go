// This file "database.go" is created by Lincan Li at 5/11/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package config

import (
	"database/sql"
	"errors"
	"git.ngs.tech/mean/houston/log"
	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
	"gopkg.in/mgo.v2"
	lg "log"
)

var (
	rdb      *gorm.DB
	mdb      *mgo.Database
	msession *mgo.Session
)

func GetX(dreConf *DreamConfig, logger *log.MeanLogger) *gorm.DB {
	if rdb == nil {
		rdb = Connect(dreConf, logger)
	}
	return rdb
}

func MustGetX() *gorm.DB {
	if rdb == nil {
		panic("x is nil")
	}
	return rdb
}

func Connect(dreConf *DreamConfig, logger *log.MeanLogger) *gorm.DB {
	var err error
	s := formConnectionString(dreConf)
	DB, err := gorm.Open("postgres", s)
	//TODO deal the error
	if err != nil {
		panic(err)
	}
	if DB == nil {
		panic("db is error")
	}

	if logger != nil {
		DB.SetLogger(logger)
	}

	DB.LogMode(false)

	return DB
}

func formConnectionString(dreConf *DreamConfig) string {
	cString := ""

	if dreConf.Address != "" {
		cString += "host=" + dreConf.Address
	}
	if dreConf.Port != "" {
		cString += " port=" + dreConf.Port
	}
	if dreConf.Username != "" {
		cString += " user=" + dreConf.Username
	}
	if dreConf.Password != "" {
		cString += " password=" + dreConf.Password
	}
	if dreConf.DatabaseName != "" {
		cString += " dbname=" + dreConf.DatabaseName
	}
	if dreConf.SSLMode != "" {
		cString += " sslmode=" + dreConf.SSLMode
	}
	return cString
}

func Begin(DB *gorm.DB) *gorm.DB {
	txn := DB.Begin()
	if txn.Error != nil {
		panic(txn.Error)
	}
	return txn
}

func Commit(txn *gorm.DB) {
	if txn == nil {
		return
	}
	txn.Commit()

	err := txn.Error
	if err != nil && err != sql.ErrTxDone {
		panic(err)
	}
}

func Rollback(txn *gorm.DB) {
	if txn == nil {
		return
	}
	txn.Rollback()
	if err := txn.Error; err != nil && err != sql.ErrTxDone {
		panic(err)
	}
}

func GetMDBAndMSession(mc *MongoConfig) (*mgo.Session, *mgo.Database) {
	if mdb == nil || msession == nil {
		msession, mdb = ConnectMongoDB(mc)
	}

	return msession, mdb
}

func MustGetMDBAndMSession() (*mgo.Session, *mgo.Database) {
	if mdb == nil || msession == nil {
		panic(errors.New("mongo connection nil"))
	}

	return msession, mdb
}

func GetMongoConnectionString(mc *MongoConfig) string {
	if mc.Username == `` || mc.Password == `` {
		return `mongodb://` + mc.Address + `:` + mc.Port + `/mean`
	}

	return `mongodb://` + mc.Username + `:` + mc.Password + `@` + mc.Address + `:` + mc.Port + `/mean`
}

func ConnectMongoDB(mc *MongoConfig) (*mgo.Session, *mgo.Database) {
	var err error
	s := GetMongoConnectionString(mc)
	lg.Println(s)
	MDBSession, err := mgo.Dial(s)
	if err != nil {
		panic(err)
	}
	MDB := MDBSession.DB("mean")

	return MDBSession, MDB
}
