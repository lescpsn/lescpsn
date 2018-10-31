// This file "tostring.go" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"git.ngs.tech/mean/proto"
)

func Str2PhotoPrivacy(s string) proto.PhotoPrivacy {
	if s == "photo_privacy_public" || s == "PhotoPrivacyPublic" {
		return proto.PhotoPrivacy_photo_privacy_public
	} else if s == "photo_privacy_private" || s == "PhotoPrivacyPrivate" {
		return proto.PhotoPrivacy_photo_privacy_private
	}

	return 0
}

func Str2Gender(s string) proto.Gender {
	if s == "female" || s == "Female" {
		return proto.Gender_user_gender_female
	} else if s == "male" || s == "Male" {
		return proto.Gender_user_gender_male
	}

	return proto.Gender_user_gender_null
}
