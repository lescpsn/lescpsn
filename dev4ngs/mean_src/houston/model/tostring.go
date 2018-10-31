// This file "tostring.go" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	. "git.ngs.tech/mean/proto"
)

func Str2PhotoPrivacy(s string) PhotoPrivacy {
	if s == "photo_privacy_public" || s == "PhotoPrivacyPublic" {
		return PhotoPrivacy_photo_privacy_public
	} else if s == "photo_privacy_private" || s == "PhotoPrivacyPrivate" {
		return PhotoPrivacy_photo_privacy_private
	}

	return 0
}

func Str2Gender(s string) Gender {
	if s == "user_gender_female" || s == "User_Gender_Female" {
		return Gender_user_gender_female
	} else if s == "user_gender_male" || s == "User_Gender_Male" {
		return Gender_user_gender_male
	}

	return Gender_user_gender_null
}

func Str2InvitationType(s string) InvitationType {
	if s == "invitation_type_tester" || s == "InvitationTypeTester" {
		return InvitationTypeTester
	} else if s == "invitation_type_visitor" || s == "InvitationTypeVisitor" {
		return InvitationTypeVisitor
	} else if s == "invitation_type_in_house" || s == "InvitationTypeInHouse" {
		return InvitationTypeInHouse
	}
	return 0
}

func (i InvitationType) InvitationType2Str() string {
	if i == InvitationTypeTester {
		return "invitation_type_tester"
	} else if i == InvitationTypeVisitor {
		return "invitation_type_visitor"
	} else if i == InvitationTypeInHouse {
		return "invitation_type_in_house"
	}
	return ""
}
