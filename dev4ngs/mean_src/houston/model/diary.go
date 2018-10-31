// This file "news.go" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	. "git.ngs.tech/mean/proto"
	"qiniupkg.com/x/errors.v7"
)

func DiaryToData(dry *Diary, isList bool) (Dungeons, error) {

	if dry == nil {

		return nil, errors.New("The diary is not exist ! pls chek id or uuid !")

	}
	d := make(Dungeons)
	d[`id`] = dry.ID
	d[`uuid`] = dry.UUID
	d[`user_uuid`] = dry.UserUUID
	d[`diary_privacy`] = dry.DiaryPrivacy
	d[`diary_status`] = dry.DiaryStatus
	d[`title`] = dry.Title.GetString()
	d[`timestamp`] = dry.Timestamp
	d[`style`] = dry.Style.GetString()

	if !isList {
		d[`content`] = dry.Content.GetString()
	}
	return d, nil
}

func Str2DiaryPrivacy(str string) (DiaryPrivacy, error) {

	switch str {

	case "1":

		return DiaryPrivacy_diary_privacy_public, nil

	case "2":
		return DiaryPrivacy_diary_privacy_private, nil

	default:
		return 0, errors.New("The DiaryPrivacy type is wrong , please try again!")

	}

}
