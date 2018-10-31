// This file "invite.go" is created by Lincan Li at 5/11/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston

import (
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (m *MeanController) ValidateInvitation(code string) (Dungeons, error) {
	v, err := ValidateInvitation(m.MDB, code)
	if err != nil {
		return nil, err
	}

	d := make(Dungeons)
	d[`validate`] = v

	return d, nil
}

func (m *MeanController) ClaimInvitationCode(count int, iType string) ([]Dungeons, error) {
	InviteType := Str2InvitationType(iType)
	iv := []Dungeons{}
	for i := 1; i <= count; i++ {
		v, err := ClaimInvitation(m.MDB, InviteType)
		if err != nil {
			return nil, err
		}
		d := make(Dungeons)
		d[`Code`] = v.Code
		d[`Type`] = v.Type.InvitationType2Str()
		iv = append(iv, d)
	}

	return iv, nil
}

func (m *MeanController) BindUserWithInviteCode(cu *User, code string) error {

	inv, err := FirstInvitation(m.MDB, code)
	if err != nil {
		return err
	}
	if inv == nil {
		return nil
	}

	uUUIDs, err := FindInvitedUserUUIDs(m.MDB, code)
	if err != nil {
		return err
	}
	if uUUIDs == nil {
		return nil
	}

	var UUIDStrings []string
	for _, uUUID := range uUUIDs {
		UUIDStrings = append(UUIDStrings, uUUID.String())
	}
	rsp, err := Cl.GetUserByUUIDs(context.TODO(), &GetByUUIDsRequest{
		UUIDs: UUIDStrings,
	})
	if err != nil {
		return err
	}
	if rsp.User == nil {
		return nil
	}

	for _, u := range rsp.User {
		if u == nil {
			continue
		}
		if u.UUID == m.User.UUID {
			continue
		}
		// TODO 等待 UserRelation 完成
		ur1 := UserRelation{
			FromID:      Integer(m.User.ID),
			ToID:        Integer(u.ID),
			RelatedType: UserRelatedType_related_type_friend,
		}

		ur2 := UserRelation{
			FromID:      Integer(u.ID),
			ToID:        Integer(m.User.ID),
			RelatedType: UserRelatedType_related_type_friend,
		}

		if _, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
			UserRelation: &ur1,
		}); err != nil {
			return err
		}
		if _, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
			UserRelation: &ur2,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
			Id:    u.ID,
			Value: 1,
		}); err != nil {
			return err
		}
		if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
			Id:    m.User.ID,
			Value: 1,
		}); err != nil {
			return err
		}
	}

	err = InsertInvitedUser(m.MDB, Str2UUID(cu.UUID), code)

	if err != nil {
		return ServerErr
	}
	return nil
}
