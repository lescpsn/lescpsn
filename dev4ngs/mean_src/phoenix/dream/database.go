// This file "init.go" is created by lincan at 11/19/15.
// Copyright © 2015 - lincan. All rights reserved

package dream

import (
	"database/sql"
	"errors"
	"git.ngs.tech/mean/phoenix/config"
	"git.ngs.tech/mean/phoenix/log"
	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
	"gopkg.in/mgo.v2"
)

var (
	rdb      *gorm.DB
	mdb      *mgo.Database
	msession *mgo.Session
)

func GetX(dreConf *config.DreamConfig, logger *log.MeanLogger) *gorm.DB {
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

func Connect(dreConf *config.DreamConfig, logger *log.MeanLogger) *gorm.DB {
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

func formConnectionString(dreConf *config.DreamConfig) string {
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

func SetUpDB(DB *gorm.DB) {
	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

	if err := DB.AutoMigrate(&Admin{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&Notification{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&Role{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&AdminRoleRelation{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&Permission{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&RolePermissionRelation{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&Menu{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&Operation{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&MenuPermissionRelation{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&OperationPermissionRelation{}).Error; err != nil {
		panic(err)
	}
}

//////////////////////////////////////////////////////
// MongoDB
//////////////////////////////////////////////////////

func GetMDBAndMSession(mc *config.MongoConfig) (*mgo.Session, *mgo.Database) {
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

func GetMongoConnectionString(mc *config.MongoConfig) string {
	if mc.Username == `` || mc.Password == `` {
		return `mongodb://` + mc.Address + `:` + mc.Port + ``
	}

	return `mongodb://` + mc.Username + `:` + mc.Password + `@` + mc.Address + `:` + mc.Port + ``
}

func ConnectMongoDB(mc *config.MongoConfig) (*mgo.Session, *mgo.Database) {
	var err error
	MDBSession, err := mgo.Dial(GetMongoConnectionString(mc))
	if err != nil {
		panic(err)
	}
	MDB := MDBSession.DB("mean")

	return MDBSession, MDB
}

/*
func SetUpMongoDB(MDB *mgo.Database) {
	accountC := SMSAccountCollection(MDB)

	cInfo := &mgo.CollectionInfo{}
	accountC.Create(cInfo)

}

func DropMongoDB(MDB *mgo.Database) {
	accountC := SMSAccountCollection(MDB)
	err := accountC.DropCollection()
	if err != nil {
		panic(err)
	}
}

*/