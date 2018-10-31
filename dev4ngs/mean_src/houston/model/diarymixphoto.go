package model

import (
	"gopkg.in/mgo.v2/bson"
)

const (
	DataTypeDiary = "DataTypeDiary"
	DataTypePhoto = "DataTypePhoto"
)

type Diarymixphoto struct {
	ID        bson.ObjectId `json:"id" bson:"_id,omitempty"`
	UserUUID  string        `bson:"user_uuid"`
	Timestamp string        `bson:"timestamp"`
	Datatype  string        `bson:"data_type"` // "DataTypeDiary" | "DataTypePhoto" 两种类型
	Data      Dungeons      `bson:"data"`
}

//ToData 输出 Diarymixphoto 的信息
func (dmp Diarymixphoto) ToData() (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = dmp.ID
	d[`user_uuid`] = dmp.UserUUID
	d[`timestamp`] = dmp.Timestamp
	d[`data_type`] = dmp.Datatype
	d[`data`] = dmp.Data
	return d, nil
}
