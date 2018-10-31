// This file "userrelation.go" is created by Lincan Li at 6/14/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"time"
)

// UserRelation Struct, 用于储存用户关系
type DB_UserRelation struct {
	Model

	FromID          *IntegerType
	From            *DB_User `gorm:"ForeignKey:FromID"`
	ToID            *IntegerType
	To              *DB_User `gorm:"ForeignKey:ForeignKey"`
	RelatedType     UserRelatedType
	ApplyingFriends *BooleanType
	ApplyAt         time.Time   `json:"apply_at,omitempty"`
	Remark          *StringType `json:"remark,omitempty"`
}

func (a *DB_UserRelation) TableName() string {
	return "user_relations"
}

// GetRelation 方法: 获取当前用户和传入用户的关系对象, 其方向为:
// 		当前用户   -->   传入用户
func (u *DB_User) GetRelation(DB *gorm.DB, rUser *DB_User) (*DB_UserRelation, error) {
	var uRelation DB_UserRelation

	if err := DB.Where(&DB_UserRelation{FromID: Integer(u.ID), ToID: Integer(rUser.ID)}).First(&uRelation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &uRelation, nil

}

// GetRelationByUsersID 方法: 获取当前用户和传入用户的关系对象, 其方向为:
// 		当前用户   -->   传入用户
func GetRelationByUsersID(DB *gorm.DB, fID, toID int64) (*DB_UserRelation, error) {
	var uRelation DB_UserRelation
	if err := DB.Where(&DB_UserRelation{FromID: Integer(fID), ToID: Integer(toID)}).First(&uRelation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &uRelation, nil

}

// GetRelation 方法: 获取当前用户和传入用户的关系类型, 其方向为:
// 		当前用户   -->   传入用户
// 如关系对象不存在,则返回 UserRelatedTypeNone
func (u *DB_User) GetRelationType(DB *gorm.DB, rUser *DB_User) (UserRelatedType, error) {
	uRelation, err := u.GetRelation(DB, rUser)
	if err != nil {
		return 0, err
	}

	if uRelation == nil {
		return UserRelatedType_related_type_none, nil
	}

	return uRelation.RelatedType, nil
}

// GetRelation 方法: 获取当前用户和传入用户的关系类型, 其方向为:
// 		当前用户   -->   传入用户
// 如关系对象不存在,则返回 UserRelatedTypeNone
func GetRelationTypeByUsersID(DB *gorm.DB, fID, toID int64) (UserRelatedType, error) {
	uRelation, err := GetRelationByUsersID(DB, fID, toID)
	if err != nil {
		return 0, err
	}

	if uRelation == nil {
		return UserRelatedType_related_type_none, nil
	}

	return uRelation.RelatedType, nil
}

// UpsertRelation 方法: 生成或更新当前用户和传入用户的关系类型, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *DB_User) UpsertRelation(DB *gorm.DB, rUser *DB_User, rType UserRelatedType) (*DB_UserRelation, error) {
	var relation DB_UserRelation

	if err := DB.Where(&DB_UserRelation{FromID: Integer(u.ID), ToID: Integer(rUser.ID)}).FirstOrInit(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	relation.RelatedType = rType

	if err := DB.Save(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

func GetRelationByID(DB *gorm.DB, id int64) (*DB_UserRelation, error) {

	var relation DB_UserRelation

	if err := DB.Where(&DB_UserRelation{Model: Model{ID: id}}).First(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil

}

func FirstOrCreateRelation(DB *gorm.DB, ur *DB_UserRelation) (*DB_UserRelation, error) {
	var relation DB_UserRelation

	if err := DB.Where(ur).FirstOrCreate(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

func UpdateUserRelation(DB *gorm.DB, ur *DB_UserRelation) (*DB_UserRelation, error) {
	var relation DB_UserRelation

	if err := DB.Update(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

// RequestFriend 方法: 保存 当前用户 对 传入用户 的好友申请状态, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *DB_User) RequestFriend(DB *gorm.DB, rUser *DB_User) (*DB_UserRelation, error) {
	var requestFriendRelation DB_UserRelation
	if err := DB.Where(&DB_UserRelation{FromID: Integer(u.ID), ToID: Integer(rUser.ID)}).FirstOrInit(&requestFriendRelation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	requestFriendRelation.ApplyingFriends = Boolean(true)

	if err := DB.Save(&requestFriendRelation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &requestFriendRelation, nil
}

// CleanFriendRequest 方法: 清除 当前用户 对 传入用户 的好有申请状态, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *DB_User) CleanFriendRequest(DB *gorm.DB, rUser *DB_User) (*DB_UserRelation, error) {
	var rejectFriendRequest DB_UserRelation
	if err := DB.Where(&DB_UserRelation{FromID: Integer(rUser.ID), ToID: Integer(u.ID)}).FirstOrInit(&rejectFriendRequest).Error; err != nil {
		return nil, NewXFailError(err)
	}
	rejectFriendRequest.ApplyingFriends = Boolean(false)

	if err := DB.Save(&rejectFriendRequest).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &rejectFriendRequest, nil
}

func (u *DB_User) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&u).Error; err != nil {
		return NewXFailError(err)
	}

	now := time.Now()
	u.DeletedAt = &now
	return nil
}

// MakeFriend 方法: 将 当前用户 和 传入用户 相互设为好友关系, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *DB_User) MakeFriend(DB *gorm.DB, rUser *DB_User) (*DB_UserRelation, error) {
	var relation DB_UserRelation

	if err := DB.Where(&DB_UserRelation{FromID: Integer(u.ID), ToID: Integer(rUser.ID)}).FirstOrInit(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	relation.ApplyingFriends = Boolean(false)
	relation.RelatedType = UserRelatedType_related_type_friend
	if err := DB.Save(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

// TerminateFriendship 方法: 解除 当前用户 和 传入用户 相互之间的好友状态, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *DB_User) TerminateFriendship(DB *gorm.DB, rUser *DB_User) (*DB_UserRelation, error) {
	var relation DB_UserRelation

	if err := DB.Where(&DB_UserRelation{FromID: Integer(u.ID), ToID: Integer(rUser.ID)}).FirstOrInit(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	relation.ApplyingFriends = Boolean(false)
	relation.RelatedType = UserRelatedType_related_type_none
	if err := DB.Save(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

func GetFriends(DB *gorm.DB, userID int64, o *QueryParameter) ([]*DB_UserRelation, error) {
	var rt []UserRelatedType
	rt = append(rt, UserRelatedType_related_type_friend)
	return GetRelation(DB, userID, o, false, rt)
}

func GetFollowee(DB *gorm.DB, userID int64, o *QueryParameter) ([]*DB_UserRelation, error) {
	var rt []UserRelatedType
	rt = append(rt, UserRelatedType_related_type_followee, UserRelatedType_related_type_mutual_follow)
	return GetRelation(DB, userID, o, false, rt)
}

func GetFollows(DB *gorm.DB, userID int64, o *QueryParameter) ([]*DB_UserRelation, error) {
	var rt []UserRelatedType
	rt = append(rt, UserRelatedType_related_type_follower, UserRelatedType_related_type_mutual_follow)
	return GetRelation(DB, userID, o, false, rt)
}

func GetRelation(DB *gorm.DB, userID int64, o *QueryParameter, isIgnoreRT bool, relationType []UserRelatedType) ([]*DB_UserRelation, error) {
	var re []*DB_UserRelation
	query := BuildQuery(DB, o)
	query = query.Where("from_id=?", userID)

	if !isIgnoreRT {
		query = query.Where("related_type in (?)", relationType)
	}

	if err := query.Find(&re).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	var users []*DB_User
	var userIds []int64
	for _, v := range re {
		v.To = &DB_User{}
		v.To.ID = v.ToID.Int
		users = append(users, v.To)
		userIds = append(userIds, v.ToID.Int)
	}
	if err := DB.Where("id in (?)", userIds).Find(&users).Error; err != nil {
		return nil, NewXFailError(err)
	}
	for k, v := range re {
		//re[k].From = cu
		for _, vv := range users {
			if vv.ID == v.ToID.Int {
				re[k].To = vv
			}
		}
	}
	return re, nil
}
