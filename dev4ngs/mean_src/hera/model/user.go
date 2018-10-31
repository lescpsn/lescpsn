package model

import (
	"encoding/json"
	echo "git.ngs.tech/mean/proto"
	"gopkg.in/mgo.v2"
	"time"
)

type UserDataOption struct {
	FillSensitive bool
	FillToken     bool
	LiteData      bool
	DynamicData   bool
	CreateData    bool
}

func UserToData(mdb *mgo.Database, u *echo.User, o *UserDataOption) (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = u.ID
	d[`uuid`] = u.UUID
	avatar, err := GetActiveAvatar(mdb, u.UUID)
	if avatar != nil && err == nil {
		d[`avatar`] = AvatarToData(avatar)
	}

	if o.LiteData {
		return d, nil
	}
	d[`nickname`] = u.Nickname.GetString()
	d[`followees`] = u.FolloweesCount.Int
	d[`followers`] = u.FollowersCount.Int
	if o.FillSensitive {
		d[`tuso_id`] = u.TusoID.GetString()
		if v := u.RealName; v != nil {
			d[`real_name`] = v
		}
		if o.DynamicData {
			return d, nil
		}
		if v := Str2Time(u.Birthday); v != (time.Time{}) {
			d[`birthday`] = v.Format(time.RFC3339)
		}
		if v := u.Gender; v != 0 {
			d[`gender`] = v.String()
		}
		if v := u.Location; v != nil {
			var l Location
			if err := json.Unmarshal([]byte(v.GetString()), &l); err != nil {
				return nil, err
			}
			d[`location`] = l
		}

		d[`friends`] = u.FriendsCount.Int
		d[`images`] = u.ImagesCount.Int
		d[`tusos`] = u.TusosCount.Int
	}
	//if o.CreateData {
	// 用户第一次上传图片的时候查询, 存入用户表, 然后每次查询用户表的时候查询是否有create_at的值 无就重新查询赋值, 有就忽略

	if u.FirstPhoto != "" {
		d[`photo_create_at`] = u.FirstPhoto
	}
	d[`user_create_at`] = u.CreatedAt
	d[`tuso_create_at`] = time.Now()
	//}
	if o.FillToken {
		d[`token`] = u.Token.GetString()
		d[`nuclear_key`] = u.NuclearKey.GetString()
	}
	return d, nil
}
