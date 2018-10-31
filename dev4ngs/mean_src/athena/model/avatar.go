// This file "avatar.go" is created by Lincan Li at 6/28/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"github.com/satori/go.uuid"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"time"
)

type UserAvatar struct {
	ID        bson.ObjectId `json:"id" bson:"_id,omitempty" json:"id"`
	UserUUID  string        `bson:"user_uuid" json:"user_uuid"`
	PhotoUUID string        `bson:"photo_uuid" json:"photo_uuid"`
	AvatarURL string        `bson:"avatar_url" json:"big_image_url"`
	Active    bool          `bson:"active" json:"active"`
	Timestamp time.Time     `bson:"timestamp" json:"timestamp"`
}

// SMSAccountCollectionName 方法, 返回 Collection 字段
func AvatarCollectionName() string {
	return "avatar"
}

// SMSAccountCollection 方法, 返回 Collection
func AvatarsCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(AvatarCollectionName())
}

// CollectionName 方法, 返回 UserSecret 的 Collection 字段
func (u *UserAvatar) CollectionName() string {
	return AvatarCollectionName()
}

// Collection 方法, 返回 UserSecret 的 Collection
func (u *UserAvatar) Collection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(u.CollectionName())
}

// Mark - Begin secret methods
// GetSecrets 方法: 获取 User 的 UserSecrete 数组
func InsertAvatar(MDB *mgo.Database, a *UserAvatar) (*UserAvatar, error) {
	avatar := UserAvatar{
		ID:        bson.NewObjectId(),
		UserUUID:  a.UserUUID,
		AvatarURL: a.AvatarURL,
		Timestamp: a.Timestamp,
	}
	if a.PhotoUUID != "" {
		avatar.PhotoUUID = a.PhotoUUID
	}
	if err := AvatarsCollection(MDB).Insert(&avatar); err != nil {
		return nil, err
	}

	return &avatar, nil
}

func ResetActiveAvatar(MDB *mgo.Database, uUUID string) error {
	if _, err := AvatarsCollection(MDB).UpdateAll(bson.M{"user_uuid": uUUID}, bson.M{
		"$set": bson.M{
			"active": false,
		},
	}); err != nil {
		return err
	}

	return nil
}

func SetActiveAvatar(MDB *mgo.Database, uUUID string, a *UserAvatar) (*UserAvatar, error) {
	if err := AvatarsCollection(MDB).Update(bson.M{"user_uuid": uUUID, "_id": a.ID}, bson.M{
		"$set": bson.M{
			"active": true,
		},
	}); err != nil {
		return nil, err
	}

	return GetActiveAvatar(MDB, uUUID)
}

func SetActiveAvatarWithTime(MDB *mgo.Database, uUUID string, a *UserAvatar) (*UserAvatar, error) {
	if err := AvatarsCollection(MDB).Update(bson.M{"user_uuid": uUUID, "_id": a.ID}, bson.M{
		"$set": bson.M{
			"active":    true,
			"timestamp": time.Now(),
		},
	}); err != nil {
		return nil, err
	}

	return GetActiveAvatar(MDB, uUUID)
}

func GetAvatarByObjectId(MDB *mgo.Database, uUUID string, ObjectId bson.ObjectId) (*UserAvatar, error) {
	var avatar UserAvatar
	if err := AvatarsCollection(MDB).Find(bson.M{"user_uuid": uUUID, "_id": ObjectId}).One(&avatar); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &avatar, nil
}

func RemoveAvatarById(MDB *mgo.Database, uUUID string, ObjectId bson.ObjectId) error {
	if err := AvatarsCollection(MDB).Remove(bson.M{"user_uuid": uUUID, "_id": ObjectId}); err != nil {
		return err
	}
	return nil
}

func RemoveAllAvatar(MDB *mgo.Database, uUUID string) error {
	if _, err := AvatarsCollection(MDB).RemoveAll(bson.M{"user_uuid": uUUID}); err != nil {
		return err
	}
	return nil
}

func GetActiveAvatar(MDB *mgo.Database, uUUID string) (*UserAvatar, error) {
	var avatar UserAvatar
	if err := AvatarsCollection(MDB).Find(bson.M{"user_uuid": uUUID, "active": true}).One(&avatar); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &avatar, nil
}

func GetUserAvatars(MDB *mgo.Database, uUUID uuid.UUID) ([]*UserAvatar, error) {
	var avatars []*UserAvatar
	if err := AvatarsCollection(MDB).Find(bson.M{"user_uuid": uUUID.String()}).Sort("-timestamp").All(&avatars); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return avatars, nil
}

func AvatarToData(a *UserAvatar) Dungeons {
	d := make(Dungeons)
	d[`id`] = a.ID
	d[`user_uuid`] = a.UserUUID
	d[`photo_uuid`] = a.PhotoUUID
	d[`big_image_url`] = a.AvatarURL
	d[`small_image_url`] = a.AvatarURL + "?imageView2/1/w/200/h/200"
	d[`active`] = a.Active
	d[`timestamp`] = a.Timestamp
	return d
}
