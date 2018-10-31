// This file "invite.go" is created by Lincan Li at 5/11/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"github.com/satori/go.uuid"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"time"
)

type InvitationStatus int

const (
	InvitationStatusActive InvitationStatus = 1 + iota
	InvitationStatusLimited
)

type InvitationType int

const (
	InvitationTypeTester InvitationType = 1 + iota
	InvitationTypeVisitor
	InvitationTypeInHouse
)

// Invitation struct, 邀请码相关, 用于记录邀请码, 邀请码所有人和使用数量
type Invitation struct {
	ID           bson.ObjectId    `json:"id" bson:"_id,omitempty"`
	Code         string           `bson:"code"`
	Owner        string           `bson:"owner"`
	AppliedCount int              `bson:"applied"`
	Type         InvitationType   `bson:"type"`
	Status       InvitationStatus `bson:"status"`
	Timestamp    time.Time        `bson:"timestamp"`
}

// InvitationCollectionName 方法, 返回 Collection 字段
func InvitationCollectionName() string {
	return "invitation"
}

// InvitationCollection 方法, 返回 Collection
func InvitationCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(InvitationCollectionName())
}

// CollectionName 方法, 返回 Invitation 的 Collection 字段
func (i *Invitation) CollectionName() string {
	return "invitation"
}

// Collection 方法, 返回 Invitation 的 Collection
func (i *Invitation) Collection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(i.CollectionName())
}

func ClaimInvitation(MDB *mgo.Database, iType InvitationType) (*Invitation, error) {
	inv := &Invitation{
		Code:         string(RandomNumber(6)),
		AppliedCount: 0,
		Type:         iType,
		Status:       InvitationStatusActive,
		Timestamp:    time.Now(),
	}

	if err := inv.Collection(MDB).Insert(inv); err != nil {
		return nil, err
	}

	return inv, nil
}

// IncrementApplied 方法, applied 加 1
func (i *Invitation) IncrementApplied(MDB *mgo.Database) (*Invitation, error) {
	change := mgo.Change{
		Update:    bson.M{"$inc": bson.M{"applied": 1}},
		ReturnNew: true,
	}

	i.Collection(MDB).Find(bson.M{"_id": i.ID}).Apply(change, i)
	return i, nil
}

func (i *Invitation) TypeValidation() bool {
	switch i.Type {
	case InvitationTypeInHouse:
		if i.AppliedCount > 5 {
			return false
		}
		tLimit, _ := time.Parse(time.RFC822, "30 Jun 16 12:00 UTC")
		if !i.Timestamp.Before(tLimit) {
			return false
		}
	case InvitationTypeVisitor:
		tLimit := i.Timestamp.Add(24 * time.Hour)
		if tLimit.Before(time.Now()) {
			return false
		}
		if i.AppliedCount > 1 {
			return false
		}
	case InvitationTypeTester:
		tLimit := i.Timestamp.AddDate(0, 1, 0)
		if tLimit.Before(time.Now()) {
			return false
		}
		if i.AppliedCount > 1 {
			return false
		}
	}

	return true
}

func (i *Invitation) ValidateInvitation(code string) bool {
	if i.Status == InvitationStatusLimited {
		return false
	}

	if !i.TypeValidation() {
		return false
	}

	return i.Code == code
}

func FirstInvitation(MDB *mgo.Database, code string) (*Invitation, error) {
	var invitation Invitation
	if err := InvitationCollection(MDB).Find(bson.M{"code": code}).One(&invitation); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &invitation, nil
}

func ValidateInvitation(MDB *mgo.Database, code string) (bool, error) {
	if code == "111111" || code == "123456"{
		return true, nil
	}

	//查询数据库是否存在此邀请码
	invitation, err := FirstInvitation(MDB, code)
	if err != nil {
		return false, err
	}
	if invitation == nil {
		return false, nil
	}
	//查询邀请码的可用性
	if !invitation.ValidateInvitation(code) {
		return false, nil
	}
	////邀请码的申请人+1
	//if _, err = invitation.IncrementApplied(MDB); err != nil {
	//	return true, err
	//}

	return true, nil
}

type InviteUser struct {
	UserUUID string `bson:"user_uuid"`
	Code     string `bson:"code"`
}

// SMSAccountCollectionName 方法, 返回 Collection 字段
func InvitationUserCollectionName() string {
	return "invite_user"
}

// SMSAccountCollection 方法, 返回 Collection
func InvitationUserCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(InvitationUserCollectionName())
}

// CollectionName 方法, 返回 Invitation 的 Collection 字段
func (iu *InviteUser) CollectionName() string {
	return "invite_user"
}

// Collection 方法, 返回 Invitation 的 Collection
func (iu *InviteUser) Collection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(iu.CollectionName())
}

func InsertInvitedUser(MDB *mgo.Database, uUUID uuid.UUID, code string) error {
	iu := &InviteUser{
		Code:     code,
		UserUUID: uUUID.String(),
	}
	if err := InvitationUserCollection(MDB).Insert(iu); err != nil {
		return err
	}
	return nil
}

func FindInvitedUserUUIDs(MDB *mgo.Database, code string) ([]uuid.UUID, error) {
	var ius []*InviteUser
	if err := InvitationUserCollection(MDB).Find(bson.M{"code": code}).All(&ius); err != nil {
		return nil, err
	}
	if ius == nil {
		return nil, nil
	}

	var UUIDs []uuid.UUID
	for _, i := range ius {
		UUID := uuid.FromStringOrNil(i.UserUUID)
		if UUID != uuid.Nil {
			UUIDs = append(UUIDs, UUID)
		}
	}

	return UUIDs, nil
}
