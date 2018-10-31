// This file "sms" is created by Lincan Li at 6/17/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	"github.com/satori/go.uuid"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

type SMSHistory struct {
	ID           bson.ObjectId `json:"id" bson:"_id,omitempty"`
	UserUUID     string        `bson:"user_uuid"`
	MobileNumber string        `bson:"mobile"`
	Message      string        `bson:"message"`
}

// SMSAccountCollectionName 方法, 返回 Collection 字段
func SMSHistoryCollectionName() string {
	return "sms_history"
}

// SMSAccountCollection 方法, 返回 Collection
func SMSHistoryCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(SMSHistoryCollectionName())
}

// CollectionName 方法, 返回 UserSecret 的 Collection 字段
func (u *SMSHistory) CollectionName() string {
	return SMSHistoryCollectionName()
}

// Collection 方法, 返回 UserSecret 的 Collection
func (u *SMSHistory) Collection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(u.CollectionName())
}

func InsertSMSHistory(s *SMSHistory) (*SMSHistory, error) {
	MDB := GetMGO()
	s.ID = bson.NewObjectId()

	if s.MobileNumber == "" || s.Message == "" {
		return nil, InvalidHistoryInput
	}

	if err := SMSHistoryCollection(MDB).Insert(s); err != nil {
		return nil, err
	}

	return s, nil
}

func GetHistoryByMobile(mobile string) ([]*SMSHistory, error) {
	MDB := GetMGO()

	var histories []*SMSHistory

	err := SMSHistoryCollection(MDB).Find(bson.M{"mobile": mobile}).All(&histories)
	if err == mgo.ErrNotFound {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return histories, nil
}

func GetHistoryByUserUUID(uUUID uuid.UUID) ([]*SMSHistory, error) {
	MDB := GetMGO()

	var histories []*SMSHistory

	err := SMSHistoryCollection(MDB).Find(bson.M{"user_uuid": uUUID.String()}).All(&histories)
	if err == mgo.ErrNotFound {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return histories, nil
}
