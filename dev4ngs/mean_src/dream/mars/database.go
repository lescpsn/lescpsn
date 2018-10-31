// This file "init.go" is created by lincan at 11/19/15.
// Copyright © 2015 - lincan. All rights reserved

package mars

import (
	"database/sql"
	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
	"log"
)

var (
	rdb          *gorm.DB
	_RDBAddress  string
	_RDBPort     string
	_RDBDBName   string
	_RDBUsername string
	_RDBPassword string
	_RDBSSLMode  string
)

func SetRDBAddress(a string) {
	_RDBAddress = a
}

func SetRDBPort(a string) {
	_RDBPort = a
}

func SetRDBName(a string) {
	_RDBDBName = a
}

func SetRDBUsername(a string) {
	_RDBUsername = a
}

func SetRDBPassword(a string) {
	_RDBPassword = a
}

func SetRDBSSLMode(a string) {
	_RDBSSLMode = a
}

func ConnectRDB() *gorm.DB {
	var err error
	s := makeConnString()
	log.Println("database connection string", s)
	DB, err := gorm.Open("postgres", s)

	if err != nil {
		panic(err)
	}
	if DB == nil {
		panic("db is error")
	}

	DB.LogMode(false)

	return DB
}

func makeConnString() string {
	return "host=" + _RDBAddress +
		" port=" + _RDBPort +
		" user=" + _RDBUsername +
		" password=" + _RDBPassword +
		" dbname=" + _RDBDBName +
		" sslmode=" + _RDBSSLMode
}

func GetRDB() *gorm.DB {
	if rdb == nil {
		rdb = ConnectRDB()
	}
	return rdb
}

func GetTransaction() *gorm.DB {
	return BeginRDB(GetRDB())
}

func BeginRDB(DB *gorm.DB) *gorm.DB {
	txn := DB.Begin()
	if txn.Error != nil {
		panic(txn.Error)
	}
	return txn
}

func CommitRDB(txn *gorm.DB) {
	if txn == nil {
		return
	}
	txn.Commit()

	err := txn.Error
	if err != nil && err != sql.ErrTxDone {
		panic(err)
	}
}

func RollbackRDB(txn *gorm.DB) {
	if txn == nil {
		return
	}
	txn.Rollback()
	if err := txn.Error; err != nil && err != sql.ErrTxDone {
		panic(err)
	}
}

func SetUpRDB(DB *gorm.DB) {
	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
	if err := DB.AutoMigrate(&DB_User{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_UserRelation{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_File{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_RawPhoto{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_Photo{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_Note{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_Comment{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_Diary{}).Error; err != nil {
		panic(err)
	}
	if err := DB.AutoMigrate(&DB_Feedback{}).Error; err != nil {
		panic(err)
	}
}

func TearDownRDB(RDB *gorm.DB) {
	RDB.Exec(`
	DROP SCHEMA  public CASCADE;
	CREATE SCHEMA public;
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	`)
}
