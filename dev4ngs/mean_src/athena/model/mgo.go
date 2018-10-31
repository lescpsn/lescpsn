package model

import (
	"git.ngs.tech/mean/athena/config"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

var (
	mdb      *mgo.Database
	msession *mgo.Session
)

func GetMDBAndMSession(mc *config.MongoConfig) (*mgo.Session, *mgo.Database) {
	if mdb == nil || msession == nil {
		msession, mdb = ConnectMongoDB(mc)
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

type Auto_Inc_Struct struct {
	Name string `bson:"name"`
	ID   int64  `bson:"id"`
}

const Auto_Inc = "auto_inc"

func GetMongo() *mgo.Database {
	_, mdb := GetMDBAndMSession(config.LoadMongoConf())
	return mdb
}


func GetAutoIncID(name string, mdb *mgo.Database) (*Auto_Inc_Struct, error) {
	var ais Auto_Inc_Struct
	change := mgo.Change{
		Update:    bson.M{"$inc": bson.M{"id": 1}},
		ReturnNew: true,
		Upsert:    true,
	}
	_, err := mdb.C(Auto_Inc).Find(bson.M{"name": name}).Apply(change, &ais)
	if err != nil {
		return nil, err
	}
	return &ais, nil
}