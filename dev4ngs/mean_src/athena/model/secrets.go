// This file "secrets.go" is created by Lincan Li at 5/11/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"github.com/satori/go.uuid"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

type UserSecrets struct {
	ID       bson.ObjectId `json:"id" bson:"_id,omitempty"`
	UserUUID string        `bson:"user_uuid"`
	Secrets  []*Secret     `bson:"secrets"`
}

type Secret struct {
	UserSecretType UserSecretType
	Code           string
	Secret         string
}

// UserSecretType 用户指示用户 UserSecret 的类型
type UserSecretType int

const (
	// UserSecretType 标示用户在更换密码
	UserSecretTypeNewPassword UserSecretType = 1 + iota
	// UserSecretType 标示用户在更换邮箱
	UserSecretTypeNewEmail
	// UserSecretTypeNewMobile 标示用户在更换手机号
	UserSecretTypeNewMobile
)

// SMSAccountCollectionName 方法, 返回 Collection 字段
func UserSecretsCollectionName() string {
	return "user_secret"
}

// SMSAccountCollection 方法, 返回 Collection
func UserSecretsCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(UserSecretsCollectionName())
}

// CollectionName 方法, 返回 UserSecret 的 Collection 字段
func (u *UserSecrets) CollectionName() string {
	return "user_secret"
}

// Collection 方法, 返回 UserSecret 的 Collection
func (u *UserSecrets) Collection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(u.CollectionName())
}

// Mark - Begin secret methods
// GetSecrets 方法: 获取 User 的 UserSecrete 数组
func GetUserSecrets(MDB *mgo.Database, uUUID uuid.UUID) (*UserSecrets, error) {
	var uSecrets UserSecrets

	err := UserSecretsCollection(MDB).Find(bson.M{"user_uuid": uUUID.String()}).One(&uSecrets)
	if err != nil && err != mgo.ErrNotFound {
		return nil, err
	}
	if err == mgo.ErrNotFound {
		uSecrets = UserSecrets{
			ID:       bson.NewObjectId(),
			UserUUID: uUUID.String(),
		}

		if err := UserSecretsCollection(MDB).Insert(&uSecrets); err != nil {
			return nil, err
		}
	}

	return &uSecrets, nil
}

func (u *UserSecrets) GetSecrets() []*Secret {
	if u.Secrets == nil {
		u.Secrets = []*Secret{}
	}
	return u.Secrets
}

func (u *UserSecrets) AppendSecret(MDB *mgo.Database, s *Secret) (*UserSecrets, error) {
	secrets := u.GetSecrets()
	secretExists := false

	for _, secret := range secrets {
		if secret.UserSecretType == s.UserSecretType {
			secretExists = true
			secret.Code = s.Code
			secret.Secret = s.Secret
		}
	}
	if !secretExists {
		secrets = append(secrets, s)
	}

	if err := u.Collection(MDB).Update(bson.M{"_id": u.ID}, bson.M{
		"$set": bson.M{
			"secrets": secrets,
		},
	}); err != nil {
		return nil, err
	}

	return u, nil
}

func (u *UserSecrets) RemoveSecretsByType(MDB *mgo.Database, uType UserSecretType) (*UserSecrets, error) {
	secrets := u.GetSecrets()
	var index int

	for v, secret := range secrets {
		if secret.UserSecretType == uType {
			index = v
			break
		}
	}

	secrets[index] = secrets[len(secrets)-1]
	secrets = secrets[:len(secrets)-1]

	if err := u.Collection(MDB).Update(bson.M{"_id": u.ID}, bson.M{
		"$set": bson.M{
			"secrets": secrets,
		},
	}); err != nil {
		return nil, err
	}

	return u, nil
}

func (u *UserSecrets) GetSecretForType(MDB *mgo.Database, uType UserSecretType) (*Secret, error) {
	secrets := u.GetSecrets()
	for _, secret := range secrets {
		if secret.UserSecretType == uType {
			return secret, nil
		}
	}
	return nil, nil
}

func (u *UserSecrets) GetSecretForNewPassword(MDB *mgo.Database) (*Secret, error) {
	return u.GetSecretForType(MDB, UserSecretTypeNewPassword)
}

func (u *UserSecrets) GetSecretForNewEmail(MDB *mgo.Database) (*Secret, error) {

	return u.GetSecretForType(MDB, UserSecretTypeNewEmail)
}

func (u *UserSecrets) GetSecretForNewMobile(MDB *mgo.Database) (*Secret, error) {
	return u.GetSecretForType(MDB, UserSecretTypeNewMobile)
}
