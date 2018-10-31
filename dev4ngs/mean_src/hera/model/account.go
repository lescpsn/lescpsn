// This file "account" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"time"
)

// MobileAccount, 未注册用户的临时账号, 用于保存手机验证码等相关 信息
type MobileAccount struct {
	ID          bson.ObjectId `json:"id" bson:"_id,omitempty"`
	PhoneNumber string        `bson:"phone_number"`
	Code        string        `bson:"code"`
	Secret      string        `bson:"secret"`
	Timestamp   time.Time     `bson:"timestamp"`
}

// SMSAccountCollectionName 方法, 返回 Collection 字段
func SMSAccountCollectionName() string {
	return "sms_account"
}

// SMSAccountCollection 方法, 返回 Collection
func SMSAccountCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(SMSAccountCollectionName())
}

// CollectionName 方法, 返回 SMSAccount 的 Collection 字段
func (s *MobileAccount) CollectionName() string {
	return "sms_account"
}

// Collection 方法, 返回 SMSAccount 的 Collection
func (s *MobileAccount) Collection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(s.CollectionName())
}

// UpdateCodeAndSecret 方法, 更新 Code 和 Secrete
func (s *MobileAccount) UpdateCodeAndSecret(MDB *mgo.Database) (*MobileAccount, error) {
	s.Code = RandomNumber(6)
	s.Secret = RandomString(32)

	s.Collection(MDB).Update(bson.M{"_id": s.ID}, bson.M{
		"$set": bson.M{
			"code":      s.Code,
			"secret":    s.Secret,
			"timestamp": time.Now(),
		},
	})

	return s, nil
}

// ValidateSecret 方法, 验证 传入 secret 和本 secret 是否一致
func (s *MobileAccount) ValidateSecret(se string) bool {
	return s.Secret == se
}

// Save 方法, 保存新的 SMSAccount
func (s *MobileAccount) Save(MDB *mgo.Database) (*MobileAccount, error) {
	if err := s.Collection(MDB).Insert(&s); err != nil {
		return nil, err
	}
	return s, nil
}

// Delete 方法, 删除本 smsAccount
func (s *MobileAccount) Delete(MDB *mgo.Database) (*MobileAccount, error) {
	err := s.Collection(MDB).Remove(bson.M{"_id": s.ID})
	if err != nil {
		return nil, err
	}
	return s, nil
}