// This file "database.go" is created by Lincan Li at 6/22/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	_ "github.com/lib/pq"
	"gopkg.in/mgo.v2"
	"log"
)

var (
	mdb      *mgo.Database
	msession *mgo.Session
)

var (
	_MGOUserName string
	_MGOPassword string
	_MGOAddress  string
	_MGOPort     string
	_MGODatabase string
)

func SetMGOUserName(s string) {
	_MGOUserName = s
}

func SetMGOPassword(s string) {
	_MGOPassword = s
}

func SetMGOAddress(s string) {
	_MGOAddress = s
}

func SetMGOPort(s string) {
	_MGOPort = s
}

func SetMGODatabase(s string) {
	_MGODatabase = s
}
func GetMGO() *mgo.Database {
	if mdb == nil {
		msession, mdb = ConnectMongoDB()
	}

	return mdb
}

func GetMongoConnectionString() string {
	if _MGOUserName == `` || _MGOPassword == `` {
		return `mongodb://` + _MGOAddress + `:` + _MGOPort + `/` + _MGODatabase
	}

	return `mongodb://` + _MGOUserName + `:` + _MGOPassword + `@` + _MGOAddress + `:` + _MGOPort + `/` + _MGODatabase
}

func ConnectMongoDB() (*mgo.Session, *mgo.Database) {
	var err error
	s := GetMongoConnectionString()

	log.Println("MongoDB Connection String ", s)

	MDBSession, err := mgo.Dial(s)
	if err != nil {
		panic(err)
	}

	MDB := MDBSession.DB(_MGODatabase)

	return MDBSession, MDB
}
