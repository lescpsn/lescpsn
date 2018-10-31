// This file "user.go" is created by Lincan Li at 11/15/2015
// Copyright Negative Space Tech LLC. All rights reserved.

// Package models provides data model definition in Tuso project
package huston

import (
	"crypto/sha1"
	"encoding/json"
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"time"
	"unicode"
)

// GetUser 方法: 获取目标用户数据
func (m *MeanController) GetUser(cu *User, UUID uuid.UUID) (Dungeons, error) {

	tuRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if tuRsp.Null {
		return nil, UserNotFoundErr
	}
	tu := tuRsp.User
	uData, err := UserToData(tu, &UserDataOption{FillSensitive: cu.ID == tu.ID})
	if err != nil {
		return nil, err
	}
	return uData, nil
}

//TODO FindUserByNickname
//func (m *MeanController) GetUsersByNickName(name string, options *QueryParameter) ([]Dungeons, error) {
//
//	uRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
//		UUID: UUID.GetString(),
//	})
//	users, err := DCenter.FindUsersByNickName(name, options)
//
//	usersData := []Dungeons{}
//	if err != nil {
//		return nil, err
//	}
//	if users == nil {
//		return nil, UserNotFoundErr
//	}
//
//	for _, user := range users {
//		uData, err := user.ToData(&UserDataOption{FillSensitive: m.User.ID == user.ID})
//		if err != nil {
//			return nil, err
//		}
//		usersData = append(usersData, uData)
//	}
//	return usersData, nil
//}

func (m *MeanController) GetUsersTusoID(tusoID string) (Dungeons, error) {

	uRsp, err := Cl.GetUserByTusoID(context.TODO(), &GetUserByTusoIDRequest{
		TusoID: tusoID,
	})
	if err != nil {
		return nil, err
	}
	if uRsp.Null {
		return nil, UserNotFoundErr
	}
	user := uRsp.User

	reRsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: m.User.ID,
		ToID:   user.ID,
	})
	if err != nil {
		return nil, err
	}

	uData, err := UserToData(user, &UserDataOption{FillSensitive: m.User.ID == user.ID})
	if err != nil {
		return nil, err
	}

	var relatedType UserRelatedType

	applying := false
	if !reRsp.Null {
		relation := reRsp.UserRelation
		// 给空的 relatedType 赋值
		relatedType = relation.RelatedType
		aDayBefore := time.Now().AddDate(0, 0, -1)
		outTimeRequest := Str2Time(relation.ApplyAt).After(aDayBefore)
		if outTimeRequest {
			applying = true
		}
	}else {
		relatedType = UserRelatedType_related_type_none
	}
	uData[`relation_type`] = relatedType.String()
	uData[`applying`] = applying

	return uData, nil
}

//
func (m *MeanController) GetFriends(options *QueryParameter) ([]Dungeons, error) {

	fRsp, err := Cl.FindUserFriends(context.TODO(), &FindByIDWithQPRequest{
		ID:             m.User.ID,
		QueryParameter: options,
	})
	if err != nil {
		return nil, err
	}
	f := fRsp.UserRelations

	var rids []int64
	for _, relation := range f {
		rids = append(rids, relation.ToID.GetInt())
	}

	rsp, _ := Cl.GetUserByIDs(context.TODO(), &GetByIDsRequest{
		Ids: rids,
	})
	users := rsp.User

	r, err := RelationsToData(m.User, f, users)
	if err != nil {
		return nil, err
	}
	return r, nil
}
func (m *MeanController) GetFollowee(options *QueryParameter) ([]Dungeons, error) {

	fRsp, err := Cl.FindUserFollowees(context.TODO(), &FindByIDWithQPRequest{
		ID:             m.User.ID,
		QueryParameter: options,
	})
	if err != nil {
		return nil, err
	}
	f := fRsp.UserRelations

	var rids []int64
	for _, relation := range f {
		rids = append(rids, relation.ToID.GetInt())
	}

	rsp, _ := Cl.GetUserByIDs(context.TODO(), &GetByIDsRequest{
		Ids: rids,
	})
	users := rsp.User

	r, err := RelationsToData(m.User, f, users)
	if err != nil {
		return nil, err
	}
	return r, nil
}
func (m *MeanController) GetFollowers(options *QueryParameter) ([]Dungeons, error) {

	fRsp, err := Cl.FindUserFollows(context.TODO(), &FindByIDWithQPRequest{
		ID:             m.User.ID,
		QueryParameter: options,
	})
	if err != nil {
		return nil, err
	}
	tfs := fRsp.UserRelations

	var rids []int64
	for _, relation := range tfs {
		rids = append(rids, relation.ToID.GetInt())
	}

	rsp, _ := Cl.GetUserByIDs(context.TODO(), &GetByIDsRequest{
		Ids: rids,
	})
	users := rsp.User

	r, err := RelationsToData(m.User, tfs, users)
	if err != nil {
		return nil, err
	}
	return r, nil
}

// UpdateUser 方法: 更新用户
func (m *MeanController) UpdateUser(cu *User, UUID uuid.UUID, realName, nickname string, birthday *time.Time, location *Location, gender Gender) (Dungeons, error) {

	tuRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if tuRsp.Null {
		return nil, UserNotFoundErr
	}
	tu := tuRsp.User
	if !(cu.ID == tu.ID) {
		return nil, InsufficientPermissionsErr
	}

	count := 0
	for _, r := range realName {
		if unicode.Is(unicode.Scripts["Han"], r) {
			count = count + 2
		} else {
			count = count + 1
		}
		if count > 10 {
			return nil, NameFormatErr
		}
	}
	tu.RealName = String(realName)

	if nickname != "" {
		count := 0
		for _, r := range realName {
			if unicode.Is(unicode.Scripts["Han"], r) {
				count = count + 2
			} else {
				count = count + 1
			}
			if count > 12 {
				return nil, NameFormatErr
			}
		}
		tu.Nickname = String(nickname)
	}

	if birthday != nil {
		tu.Birthday = string(birthday.Format(time.RFC3339))
	}

	if location != nil {
		locationByte, err := json.Marshal(location)
		if err != nil {
			return nil, err
		}
		tu.Location = String(string(locationByte))
	}

	if gender != 0 {
		tu.Gender = gender
	}
	_, err = Cl.UpdateUser(context.TODO(), &PutUserByUUIDRequest{
		UUID: tu.UUID,
		User: tu,
	})
	if err != nil {
		return nil, err
	}

	uData, err := UserToData(tu, &UserDataOption{FillSensitive: cu.ID == tu.ID})
	if err != nil {
		return nil, err
	}
	return uData, nil
}

func (m *MeanController) RequestNewPasswordValidation(cUser *User, password string) (Dungeons, error) {
	h := sha1.New()

	h.Write([]byte(cUser.Salt.GetString() + password))
	bs := fmt.Sprintf("%x", h.Sum(nil))

	d := make(Dungeons)

	if string(bs) != cUser.Password.GetString() {
		d[`validated`] = false
		return d, nil
	}

	uSecrets, err := GetUserSecrets(m.MDB, Str2UUID(cUser.UUID))
	if err != nil {
		return nil, err
	}

	s := &Secret{
		UserSecretType: UserSecretTypeNewPassword,
		Code:           RandomNumber(6),
		Secret:         RandomString(32),
	}

	uSecrets, err = uSecrets.AppendSecret(m.MDB, s)
	if err != nil {
		return nil, err
	}

	d[`validated`] = true
	d[`secret`] = s.Secret

	return d, nil
}

func (m *MeanController) UpdateNewPassBySecret(cUser *User, password, sString string) (Dungeons, error) {

	uSecrets, err := GetUserSecrets(m.MDB, Str2UUID(cUser.UUID))
	if err != nil {
		return nil, err
	}
	secrets, err := uSecrets.GetSecretForNewPassword(m.MDB)
	if err != nil {
		return nil, err
	}
	if secrets.Secret != sString {
		return nil, InvalidSecretCodeErr
	}
	Cl.PatchUserPassword(context.TODO(), &PutUserPasswordRequest{
		UUID:     cUser.UUID,
		Password: password,
	})

	uSecrets.RemoveSecretsByType(m.MDB, UserSecretTypeNewPassword)

	uData, err := UserToData(cUser, &UserDataOption{FillSensitive: true, FillToken: true})
	if err != nil {
		return nil, err
	}
	return uData, nil
}
