// This file "user.echo.go" is created by Lincan Li at 6/15/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
)

func echo2user(user *User) *mars.DB_User {
	return &mars.DB_User{
		Model:       mars.Model{ID: user.ID, UUID: Str2UUID(user.UUID)},
		TusoId:      user.TusoID,
		Email:       user.Email,
		PhoneNumber: user.MobileNumber,
		Password:    user.Password,
		Birthday:    Str2Time(user.Birthday),
		Nickname:    user.Nickname,
		RealName:    user.RealName,
		Location:    user.Location,
		Followees:   user.FolloweesCount,
		Followers:   user.FollowersCount,
		Friends:     user.FriendsCount,
		Images:      user.ImagesCount,
		Tusos:       user.TusosCount,
		Gender:      user.Gender,
		NuclearKey:  user.NuclearKey,
		Secrets:     user.Secrets,
		Status:      user.Status,
		FirstPhoto:  Str2Time(user.FirstPhoto),
		FirstTuso:   Str2Time(user.FirstTuso),
	}
}

func user2echo(mUser *mars.DB_User) *User {
	return &User{
		ID:             mUser.ID,
		UUID:           mUser.UUID.String(),
		TusoID:         mUser.TusoId,
		Email:          mUser.Email,
		MobileNumber:   mUser.PhoneNumber,
		Birthday:       Time2Str(mUser.Birthday),
		Password:       mUser.Password,
		Token:          mUser.Token,
		Salt:           mUser.Salt,
		Nickname:       mUser.Nickname,
		RealName:       mUser.RealName,
		Gender:         mUser.Gender,
		Location:       mUser.Location,
		FolloweesCount: mUser.Followees,
		FollowersCount: mUser.Followers,
		FriendsCount:   mUser.Friends,
		ImagesCount:    mUser.Images,
		TusosCount:     mUser.Tusos,
		NuclearKey:     mUser.NuclearKey,
		Secrets:        mUser.Secrets,
		Status:         mUser.Status,
		CreatedAt:      Time2Str(mUser.CreatedAt),
		FirstPhoto:     Time2Str(mUser.FirstPhoto),
		FirstTuso:      Time2Str(mUser.FirstTuso),
	}
}

//users2echo method:将基本数据数组转化为输出对象数组
func users2echo(users []*mars.DB_User) []*User {
	var uEchos []*User
	for _, user := range users {
		uEchos = append(uEchos, user2echo(user))
	}
	return uEchos
}

//echo2userRelation method :将输出参数转化为基本对象
func echo2userRelation(ur *UserRelation) *mars.DB_UserRelation {
	return &mars.DB_UserRelation{
		Model: mars.Model{
			ID:   ur.ID,
			UUID: Str2UUID(ur.UUID),
		},
		FromID:          ur.FromID,
		ToID:            ur.ToID,
		RelatedType:     ur.RelatedType,
		ApplyingFriends: ur.ApplyingFriends,
		ApplyAt:         Str2Time(ur.ApplyAt),
		Remark:          ur.Remark,
	}
}

//userRelation2echo method :将基本对象转化为输出参数
func userRelation2echo(ur *mars.DB_UserRelation) *UserRelation {
	return &UserRelation{
		ID:              ur.ID,
		UUID:            ur.UUID.String(),
		FromID:          ur.FromID,
		ToID:            ur.ToID,
		RelatedType:     ur.RelatedType,
		ApplyingFriends: ur.ApplyingFriends,
		ApplyAt:         Time2Str(ur.ApplyAt),
		Remark:          ur.Remark,
	}

}

//userRelations2echo method:将基本数据数组转化为输出对象数组
func userRelations2echo(urs []*mars.DB_UserRelation) []*UserRelation {
	var uEchos []*UserRelation
	for _, ur := range urs {
		uEchos = append(uEchos, userRelation2echo(ur))
	}
	return uEchos
}
