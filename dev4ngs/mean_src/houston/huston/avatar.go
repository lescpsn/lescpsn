// This file "avatar.go" is created by Lincan Li at 6/28/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston

import (
	"git.ngs.tech/mean/houston/fileManager"
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2/bson"
	"time"
)

// NewUpToken 方法: 返回一个新的七牛上传 Token.
func (m *MeanController) AvatarUpToken() (*SingleEntity, error) {
	f := fileManager.NewFileManager()
	k, t := f.UpToken(avatarCallBack)
	se := &SingleEntity{
		QNToken: k,
		Expires: &t,
	}

	return se, nil
}

// 上传头像, 根据七牛的返回数据，获取URL并且存储到 UserAvatar 。
// 存成一个新的Avatar数据库表。并且插入mongo数据库，做历史头像缓存（关键字ID, ObjectId 。
// 最后将上传的新建的那个头像的 active 设置为 true。
func (m *MeanController) UploadAvatar(cu *User, rImage *RestAvatar) (Dungeons, error) {
	fm := fileManager.NewFileManager()

	file := &File{
		UserUUID: cu.UUID,
		Bucket:   String(rImage.Bucket),
		Key:      String(rImage.Key),
		Size:     Integer(rImage.FileSize),
	}
	fRsp, err := Cl.NewFile(context.TODO(), &PostFileRequest{
		File: file,
	})
	bFile := fRsp.File
	if err != nil {
		return nil, err
	}
	sys, err := GetSystemAvatars(m.MDB, cu.UUID)
	if err != nil {
		return nil, err
	}
	if sys == nil {
		err := m.setSystemAvatar(cu)
		if err != nil {
			return nil, err
		}
	}
	//生成 avatar
	avatar := &UserAvatar{
		UserUUID:  cu.UUID,
		AvatarURL: fm.GetDownloadURL(bFile.Key.GetString()),
		Timestamp: rImage.TimeStamp,
		Type:      AvatarTypeNormal,
	}

	uAvatar, err := InsertAvatar(m.MDB, avatar)
	if err != nil {
		return nil, err
	}

	if err := ResetActiveAvatar(m.MDB, cu.UUID); err != nil {
		return nil, err
	}

	setAva, err := SetActiveAvatar(m.MDB, uAvatar.UserUUID, uAvatar)
	if err != nil {
		return nil, err
	}
	if setAva == nil {
		setAva = &UserAvatar{}
	}

	d := AvatarToData(setAva)
	return d, nil
}

func (m *MeanController) setSystemAvatar(cu *User) error {
	createAt, _ := time.Parse(time.RFC3339, cu.CreatedAt)
	system := &UserAvatar{
		UserUUID:  cu.UUID,
		AvatarURL: "",
		Type:      AvatarTypeSystem,
		Timestamp: createAt,
	}
	//male := &UserAvatar{
	//	UserUUID:  cu.UUID,
	//	AvatarURL: "http://7xodxr.com2.z0.glb.qiniucdn.com/FnpLfaBR-wyQyDFY6CsAZ-76vd8e",
	//	Type:      AvatarTypeSystemMale,
	//	Timestamp: createAt,
	//}
	_, err := InsertAvatar(m.MDB, system)
	if err != nil {
		return err
	}
	//_, err = InsertAvatar(m.MDB, male)
	//if err != nil {
	//	return err
	//}
	return nil
}

// SetAvatar 方法: 更新头像, 如果 oUUID 有传入值, 则说明是通过原有图片加上 裁剪 和 滤镜 参数构成,
// 反之则是由一张新图片作为头像.
func (m *MeanController) SetAvatar(cu *User, ObjectId bson.ObjectId, oUUID uuid.UUID, time time.Time) (Dungeons, error) {
	//oUUID != uuid.Nil
	avatar, err := GetAvatarByObjectId(m.MDB, cu.UUID, ObjectId)
	if err != nil {
		return nil, err
	}
	if avatar == nil {
		return nil, PhotoNotFound
	}

	if err := ResetActiveAvatar(m.MDB, cu.UUID); err != nil {
		return nil, err
	}

	setAva, err := SetActiveAvatarWithTime(m.MDB, cu.UUID, avatar, time)
	if err != nil {
		return nil, err
	}

	d := AvatarToData(setAva)
	return d, nil
}

// GetHistoricalAvatar 方法: 创建头像, 如果 oUUID 有传入值, 则说明是通过原有图片加上 裁剪 和 滤镜 参数构成,
// 反之则是由一张新图片作为头像.
func (m *MeanController) GetHistoricalAvatar(cu *User) ([]Dungeons, error) {
	var uAvatars []*UserAvatar
	var err error

	//if cu.Gender == Gender_user_gender_female {
	//	uAvatars, err = GetUserAvatarsWithFemale(m.MDB, Str2UUID(cu.UUID))
	//	if err != nil {
	//		return nil, err
	//	}
	//}else {
	//	uAvatars, err = GetUserAvatarsWithMale(m.MDB, Str2UUID(cu.UUID))
	//	if err != nil {
	//		return nil, err
	//	}
	//}

	uAvatars, err = GetUserAvatars(m.MDB, Str2UUID(cu.UUID))
	if err != nil {
		return nil, err
	}

	ds := []Dungeons{}
	if uAvatars == nil {
		return []Dungeons{}, nil
	}

	for _, a := range uAvatars {
		d := AvatarToData(a)
		ds = append(ds, d)
	}

	return ds, nil
}
