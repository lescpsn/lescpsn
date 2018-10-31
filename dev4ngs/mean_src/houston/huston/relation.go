// This file "relation.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston

import (
	"encoding/json"
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"github.com/golang/protobuf/proto"
	"github.com/micro/go-micro/broker"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"time"
)

// Follow 方法: 当前用户 关注 传入 UUID 所代表的用户
func (m *MeanController) Follow(cu *User, UUID string) (Dungeons, error) {
	if cu.FolloweesCount.GetInt() >= 500 {
		return nil, InvalidRelationActionErr
	}
	if cu.UUID == UUID {
		return nil, InvalidRelationActionErr
	}

	ruRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID,
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User
	baseRelationType := UserRelatedType_related_type_followee
	baseCRelationType := UserRelatedType_related_type_follower

	reRsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	re1 := &UserRelation{}
	if !reRsp.Null {
		re1 = reRsp.UserRelation
		if re1.RelatedType == UserRelatedType_related_type_followee || re1.RelatedType >= UserRelatedType_related_type_followee {
			// 已存在大于或等于 关注 的关系
			return nil, InvalidRelationActionErr
		}
		if re1.RelatedType == UserRelatedType_related_type_follower {
			// 共同关注
			baseRelationType = UserRelatedType_related_type_mutual_follow
			baseCRelationType = UserRelatedType_related_type_mutual_follow
		}
	}
	re2rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	re2 := &UserRelation{}
	if !re2rsp.Null {
		re2 = re2rsp.UserRelation
		if re2.RelatedType == UserRelatedType_related_type_follower || re2.RelatedType >= UserRelatedType_related_type_followee {
			// 已存在大于或等于 关注 的关系
			return nil, InvalidRelationActionErr
		}
	}

	re1.FromID = Integer(cu.ID)
	re1.ToID = Integer(ru.ID)
	re1.RelatedType = baseRelationType

	reRsp, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re1,
	})
	if err != nil {
		return nil, err
	}
	relation := reRsp.UserRelation

	re2.FromID = Integer(ru.ID)
	re2.ToID = Integer(cu.ID)
	re2.RelatedType = baseCRelationType

	_, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re2,
	})

	// 自增字段
	if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
		Id:    cu.ID,
		Value: 1,
	}); err != nil {
		return nil, err
	}

	if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
		Id:    ru.ID,
		Value: 1,
	}); err != nil {
		return nil, err
	}
	ru.FollowersCount.Int = ru.FollowersCount.Int + 1

	// 生成动态消息
	message_body, err := proto.Marshal(&Notice{
		FromID:    cu.ID,
		ToID:      ru.ID,
		Type:      MESSAGE_TYPE_RELATION_FOLLOW,
		Timestamp: time.Now().Format(time.RFC3339),
	})
	if err != nil {
		return nil, err
	}

	// 将动态消息插入 kafka
	m.Broker.Publish(NoticeBrokerTopic, &broker.Message{
		Header: map[string]string{
			brokerType: RelationFollowNoticeJob,
		},
		Body: message_body,
	})

	return RelationToData(relation, ru, &UserDataOption{FillSensitive: false})
}

// Unollow 方法: 解除 当前用户 对 传入用户 的关注关系
func (m *MeanController) UnFollow(cu *User, UUID string) (Dungeons, error) {
	if cu.UUID == UUID {
		return nil, InvalidRelationActionErr
	}

	ruRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID,
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User

	reRsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	re := reRsp.UserRelation
	if re == nil {
		return nil, NoRelationFoundErr
	}

	re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	if re2Rsp.Null {
		return nil, NoRelationFoundErr
	}
	re2 := re2Rsp.UserRelation

	baseRelationType := UserRelatedType_related_type_none
	baseCRelationType := UserRelatedType_related_type_none

	if re.RelatedType != UserRelatedType_related_type_followee && re.RelatedType != UserRelatedType_related_type_mutual_follow {
		return nil, InvalidRelationActionErr
	}

	if re.RelatedType == UserRelatedType_related_type_mutual_follow {
		baseRelationType = UserRelatedType_related_type_follower
		baseCRelationType = UserRelatedType_related_type_followee
	}

	re.FromID = Integer(cu.ID)
	re.ToID = Integer(ru.ID)
	re.RelatedType = baseRelationType

	reRsp, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re,
	})
	if err != nil {
		return nil, err
	}
	relation := reRsp.UserRelation

	re2.FromID = Integer(ru.ID)
	re2.ToID = Integer(cu.ID)
	re2.RelatedType = baseCRelationType

	_, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re2,
	})

	// 自增字段
	if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
		Id:    cu.ID,
		Value: -1,
	}); err != nil {
		return nil, err
	}

	if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
		Id:    ru.ID,
		Value: -1,
	}); err != nil {
		return nil, err
	}
	ru.FollowersCount.Int = ru.FollowersCount.Int - 1
	return RelationToData(relation, ru, &UserDataOption{FillSensitive: false})
}

// RequestFriendByTusoID 方法: 通过 Tuso ID 查找用户 申请好友
func (m *MeanController) RequestFriendByTusoID(cu *User, mID string, message string) (Dungeons, error) {

	ruRsp, err := Cl.GetUserByTusoID(context.TODO(), &GetUserByTusoIDRequest{
		TusoID: mID,
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User
	if cu.UUID == ru.UUID {
		return nil, InvalidRelationActionErr
	}

	re1Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}

	re1 := &UserRelation{}

	if !re1Rsp.Null {
		re1 = re1Rsp.UserRelation
		if re1.RelatedType == UserRelatedType_related_type_friend {
			return nil, DuplicateFriendApplyErr
		}
		//aDayBefore := time.Now().AddDate(0, 0, -1)
		//outTime := Str2Time(re1.ApplyAt).After(aDayBefore)
		//if outTime {
		//	return nil, InvalidRelationActionErr
		//}
	}

	re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}

	re2 := &UserRelation{}

	if !re2Rsp.Null {
		re2 = re2Rsp.UserRelation
		if re2.RelatedType == UserRelatedType_related_type_friend {
			return nil, DuplicateFriendApplyErr
		}
	}

	re1.FromID = Integer(cu.ID)
	re1.ToID = Integer(ru.ID)
	re1.ApplyingFriends = Boolean(true)
	re1.ApplyAt = time.Now().Format(time.RFC3339)

	re2.FromID = Integer(ru.ID)
	re2.ToID = Integer(cu.ID)

	r1Rsp, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re1,
	})
	relation := r1Rsp.UserRelation
	if err != nil {
		return nil, err
	}
	// 生成动态消息
	c, err := json.Marshal(map[string]interface{}{
		"content": message,
	})
	if err != nil {
		return nil, err
	}
	message_body, err := proto.Marshal(&Notice{
		FromID:    cu.ID,
		ToID:      ru.ID,
		Type:      MESSAGE_TYPE_RELATION_WAS_APPLIED,
		Content:   string(c),
		Timestamp: time.Now().Format(time.RFC3339),
	})
	if err != nil {
		return nil, err
	}
	// 将动态消息插入 kafka
	m.Broker.Publish(NoticeBrokerTopic, &broker.Message{
		Header: map[string]string{
			brokerType: RelationRequestNoticeJob,
		},
		Body: message_body,
	})

	return RelationToData(relation, ru, &UserDataOption{FillSensitive: false})
}

// RequestFriend 方法: 当前用户申请成为目标用户好友, 本方法要求 当前用户 与 传入用户 需要
// 有 互相关注 关系等级
func (m *MeanController) RequestFriend(cu *User, rUUID string, message string) (Dungeons, error) {
	if cu.FriendsCount.GetInt() >= 500 {
		return nil, InvalidRelationActionErr
	}
	if cu.UUID == rUUID {
		return nil, InvalidRelationActionErr
	}
	rsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: rUUID,
	})
	if err != nil {
		return nil, err
	}
	if rsp.Null {
		return nil, UserNotFoundErr
	}
	ru := rsp.User
	re1rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	re1 := &UserRelation{}
	if !re1rsp.Null {
		re1 = re1rsp.UserRelation
		if re1.RelatedType != UserRelatedType_related_type_mutual_follow || re1.RelatedType == UserRelatedType_related_type_friend {
			return nil, InvalidRelationActionErr
		}

		aDayBefore := time.Now().AddDate(0, 0, -1)
		outTime := Str2Time(re1.ApplyAt).After(aDayBefore)
		if outTime {
			return nil, InvalidRelationActionErr
		}
	}
	re2rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	re2 := &UserRelation{}
	if !re2rsp.Null {
		re2 := re2rsp.UserRelation
		if re2.RelatedType != UserRelatedType_related_type_mutual_follow || re2.RelatedType == UserRelatedType_related_type_friend {
			return nil, InvalidRelationActionErr
		}
	}

	re1.FromID = Integer(cu.ID)
	re1.ToID = Integer(ru.ID)
	re1.ApplyingFriends = Boolean(true)
	re1.ApplyAt = time.Now().Format(time.RFC3339)

	re2.FromID = Integer(ru.ID)
	re2.ToID = Integer(cu.ID)

	relationRsp, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re1,
	})
	if err != nil {
		return nil, err
	}
	relation := relationRsp.UserRelation

	// 生成动态消息
	c, err := json.Marshal(map[string]interface{}{
		"content": message,
	})
	if err != nil {
		return nil, err
	}
	message_body, err := proto.Marshal(&Notice{
		FromID:    cu.ID,
		ToID:      ru.ID,
		Type:      MESSAGE_TYPE_RELATION_WAS_APPLIED,
		Content:   string(c),
		Timestamp: time.Now().Format(time.RFC3339),
	})
	if err != nil {
		return nil, err
	}
	// 将动态消息插入 kafka
	m.Broker.Publish(NoticeBrokerTopic, &broker.Message{
		Header: map[string]string{
			brokerType: RelationRequestNoticeJob,
		},
		Body: message_body,
	})

	return RelationToData(relation, ru, &UserDataOption{FillSensitive: false})
}

// RejectApplyFriend 方法: 拒绝 传入用户 对 目标用户 的好友请求
func (m *MeanController) RejectApplyFriend(cu *User, rUUID uuid.UUID, ObjectId string) (Dungeons, error) {

	ruRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: rUUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User
	re1Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	if re1Rsp.Null {
		return nil, NoRelationFoundErr
	}

	re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	if re2Rsp.Null {
		return nil, NoRelationFoundErr
	}
	re2 := re2Rsp.UserRelation

	if re2.ApplyingFriends.GetBool() == false {
		return nil, FriendApplicationNotFoundErr
	}
	re2.ApplyingFriends = Boolean(false)
	relationRsp, err2 := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re2,
	})
	if err2 != nil {
		return nil, err
	}
	relation := relationRsp.UserRelation

	// 生成动态消息
	message_body, err := proto.Marshal(&Notice{
		ID:        ObjectId,
		FromID:    cu.ID,
		ToID:      ru.ID,
		Type:      MESSAGE_TYPE_RELATION_REFUSE,
		Timestamp: time.Now().Format(time.RFC3339),
	})
	if err != nil {
		return nil, err
	}

	// 将动态消息插入 kafka
	m.Broker.Publish(NoticeBrokerTopic, &broker.Message{
		Header: map[string]string{
			brokerType: RelationFriendsNoticeJob,
		},
		Body: message_body,
	})

	return RelationToData(relation, ru, &UserDataOption{FillSensitive: false})
}

// AcceptApplyFriend 方法: 接受 传入用户 对 目标用户 的好友请求
func (m *MeanController) AcceptApplyFriend(cu *User, rUUID uuid.UUID, ObjectId string) (Dungeons, error) {
	if cu.FriendsCount.GetInt() >= 500 {
		return nil, InvalidRelationActionErr
	}

	ruRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: rUUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User
	re1Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	if re1Rsp.Null {
		return nil, NoRelationFoundErr
	}
	re1 := re1Rsp.UserRelation
	if re1.RelatedType == UserRelatedType_related_type_friend {
		return nil, DuplicateFriendApplyErr
	}

	re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	if re2Rsp.Null {
		return nil, NoRelationFoundErr
	}

	re2 := re2Rsp.UserRelation
	if re2.RelatedType == UserRelatedType_related_type_friend {
		return nil, DuplicateFriendApplyErr
	}

	if re2.ApplyingFriends.GetBool() != true {
		return nil, FriendApplicationNotFoundErr
	}

	//若申请好友之前处于关注或者被关注或者相互关注状态, 那成为好友之后应该将之前的关注数被关注数删除
	// TODO 有时间要将这恶心的自增代码规整, 合并
	if re1.RelatedType == UserRelatedType_related_type_followee {
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
	}
	if re1.RelatedType == UserRelatedType_related_type_follower {
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
	}
	if re2.RelatedType == UserRelatedType_related_type_followee {
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
		ru.FolloweesCount.Int = ru.FolloweesCount.Int - 1
	}
	if re2.RelatedType == UserRelatedType_related_type_follower {
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
		ru.FollowersCount.Int = ru.FollowersCount.Int - 1
	}
	if re2.RelatedType == UserRelatedType_related_type_mutual_follow && re1.RelatedType == UserRelatedType_related_type_mutual_follow {
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
		ru.FolloweesCount.Int = ru.FolloweesCount.Int - 1
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: -1,
		}); err != nil {
			return nil, err
		}
		ru.FollowersCount.Int = ru.FriendsCount.Int - 1
	}

	re1.ApplyingFriends = Boolean(false)
	re1.RelatedType = UserRelatedType_related_type_friend

	re2.ApplyingFriends = Boolean(false)
	re2.RelatedType = UserRelatedType_related_type_friend

	// 判断好友的申请时间是否在24小时之内, 是则重置到合法的时间,
	aDayBefore := time.Now().AddDate(0, 0, -1)
	outTime := Str2Time(re2.ApplyAt).After(aDayBefore)
	if outTime {
		re2.ApplyAt = time.Now().AddDate(0, 0, -2).Format(time.RFC3339)
	}

	CRRsp, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re1,
	})
	if err != nil {
		return nil, err
	}
	cuRelation := CRRsp.UserRelation

	_, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re2,
	})
	if err != nil {
		return nil, err
	}

	if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
		Id:    cu.ID,
		Value: 1,
	}); err != nil {
		return nil, err
	}

	if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
		Id:    ru.ID,
		Value: 1,
	}); err != nil {
		return nil, err
	}

	// 生成动态消息
	message_body, err := proto.Marshal(&Notice{
		ID:        ObjectId,
		FromID:    cu.ID,
		ToID:      ru.ID,
		Type:      MESSAGE_TYPE_RELATION_AGREED,
		Timestamp: time.Now().Format(time.RFC3339),
	})
	if err != nil {
		return nil, err
	}

	// 将动态消息插入 kafka
	m.Broker.Publish(NoticeBrokerTopic, &broker.Message{
		Header: map[string]string{
			brokerType: RelationFriendsNoticeJob,
		},
		Body: message_body,
	})

	ru.FriendsCount.Int = ru.FriendsCount.Int + 1

	return RelationToData(cuRelation, ru, &UserDataOption{FillSensitive: cuRelation.RelatedType >= UserRelatedType_related_type_friend})
}

// EndFriendship 方法: 终止 传入用户 与 目标用户 的好友关系
func (m *MeanController) EndFriendship(cu *User, rUUID string, follow bool) (Dungeons, error) {

	ruRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: rUUID,
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User

	re1Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	if re1Rsp.Null {
		return nil, NoRelationFoundErr
	}
	re1 := re1Rsp.UserRelation
	if re1.RelatedType != UserRelatedType_related_type_friend {
		return nil, InvalidRelationActionErr
	}

	re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: ru.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	if re2Rsp.Null {
		return nil, NoRelationFoundErr
	}
	re2 := re2Rsp.UserRelation
	if re2.RelatedType != UserRelatedType_related_type_friend {
		return nil, InvalidRelationActionErr
	}

	if follow {
		re1.RelatedType = UserRelatedType_related_type_mutual_follow
		re2.RelatedType = UserRelatedType_related_type_mutual_follow
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: 1,
		}); err != nil {
			return nil, err
		}
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: 1,
		}); err != nil {
			return nil, err
		}
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: 1,
		}); err != nil {
			return nil, err
		}
		ru.FolloweesCount.Int = ru.FolloweesCount.Int + 1
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: 1,
		}); err != nil {
			return nil, err
		}
		ru.FollowersCount.Int = ru.FollowersCount.Int + 1
	} else {
		re1.RelatedType = UserRelatedType_related_type_follower
		re2.RelatedType = UserRelatedType_related_type_followee
		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: 1,
		}); err != nil {
			return nil, err
		}
		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    ru.ID,
			Value: 1,
		}); err != nil {
			return nil, err
		}
		ru.FolloweesCount.Int = ru.FolloweesCount.Int + 1
	}

	cuRRsp, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re1,
	})
	if err != nil {
		return nil, err
	}
	cuRelation := cuRRsp.UserRelation

	if _, err := Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re2,
	}); err != nil {
		return nil, err
	}

	if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
		Id:    cu.ID,
		Value: -1,
	}); err != nil {
		return nil, err
	}

	if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
		Id:    ru.ID,
		Value: -1,
	}); err != nil {
		return nil, err
	}

	ru.FriendsCount.Int = ru.FriendsCount.Int - 1

	return RelationToData(cuRelation, ru, &UserDataOption{FillSensitive: cuRelation.RelatedType >= UserRelatedType_related_type_friend})
}

// Remark 方法: 当前用户 设置备注名 传入 UUID 代表目标的用户
func (m *MeanController) Remark(cu *User, UUID, Remark string) (Dungeons, error) {
	if cu.UUID == UUID {
		return nil, InvalidRelationActionErr
	}

	ruRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID,
	})
	if err != nil {
		return nil, err
	}
	if ruRsp.Null {
		return nil, UserNotFoundErr
	}
	ru := ruRsp.User

	reRsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   ru.ID,
	})
	if err != nil {
		return nil, err
	}
	if reRsp.Null {
		return nil, NoRelationFoundErr
	}
	re1 := reRsp.UserRelation
	if re1.RelatedType != UserRelatedType_related_type_friend {
		return nil, InvalidRelationActionErr
	}

	re1.FromID = Integer(cu.ID)
	re1.ToID = Integer(ru.ID)
	re1.Remark = String(Remark)

	reRsp, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
		UserRelation: re1,
	})
	if err != nil {
		return nil, err
	}
	relation := reRsp.UserRelation

	return RelationToData(relation, ru, &UserDataOption{FillSensitive: false})
}

// AcceptApplyFriend 方法: 接受 传入用户 对 目标用户 的好友请求
func (m *MeanController) IosAddFriendForTest(userID, MinID, MaxID int64) error {

	cuRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
		Id: userID,
	})
	//cu, err := DCenter.GetUserByID(userID)
	if err != nil {
		return err
	}
	if cuRsp.Null {
		return UserNotFoundErr
	}
	cu := cuRsp.User
	for i := MinID; i <= MaxID; i++ {
		if i == userID {
			continue
		}
		userRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
			Id: i,
		})
		if err != nil {
			return err
		}
		if userRsp.Null {
			continue
		}
		user := userRsp.User
		if user.ID == 67 {
			continue
		}
		re1Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
			FromID: cu.ID,
			ToID:   user.ID,
		})
		if err != nil {
			return err
		}
		re1 := re1Rsp.UserRelation
		if re1 != nil && re1.RelatedType == UserRelatedType_related_type_friend {
			continue
		}
		if re1 == nil {
			re1 = &UserRelation{}
		}
		re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
			FromID: user.ID,
			ToID:   cu.ID,
		})
		if err != nil {
			return err
		}
		re2 := re2Rsp.UserRelation
		if re2 != nil && re2.RelatedType == UserRelatedType_related_type_friend {
			continue
		}
		if re2 == nil {
			re2 = &UserRelation{}
		}
		re1.FromID = Integer(cu.ID)
		re1.ToID = Integer(user.ID)
		re1.ApplyingFriends = Boolean(false)
		re1.RelatedType = UserRelatedType_related_type_friend

		re2.FromID = Integer(user.ID)
		re2.ToID = Integer(cu.ID)
		re2.ApplyingFriends = Boolean(false)
		re2.RelatedType = UserRelatedType_related_type_friend

		_, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
			UserRelation: re1,
		})
		if err != nil {
			return err
		}

		if _, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
			UserRelation: re2,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: 1,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFriends(context.TODO(), &IncrementRequest{
			Id:    user.ID,
			Value: 1,
		}); err != nil {
			return err
		}
	}
	return nil
}

// AcceptApplyFriend 方法: 接受 传入用户 对 目标用户 的好友请求
func (m *MeanController) IosAddMutualFollowForTest(userID, MinID, MaxID int64) error {

	cuRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
		Id: userID,
	})
	//cu, err := DCenter.GetUserByID(userID)
	if err != nil {
		return err
	}
	if cuRsp.Null {
		return UserNotFoundErr
	}
	cu := cuRsp.User
	for i := MinID; i <= MaxID; i++ {
		if i == userID {
			continue
		}
		userRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
			Id: i,
		})
		if err != nil {
			return err
		}
		if userRsp.Null {
			continue
		}
		user := userRsp.User
		if user.ID == 67 {
			continue
		}
		re1Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
			FromID: cu.ID,
			ToID:   user.ID,
		})
		if err != nil {
			return err
		}
		re1 := re1Rsp.UserRelation
		if re1 != nil && re1.RelatedType == UserRelatedType_related_type_mutual_follow {
			continue
		}
		if re1 == nil {
			re1 = &UserRelation{}
		}
		re2Rsp, err := Cl.GetRelation(context.TODO(), &GetRelationRequest{
			FromID: user.ID,
			ToID:   cu.ID,
		})
		if err != nil {
			return err
		}
		re2 := re2Rsp.UserRelation
		if re2 != nil && re2.RelatedType == UserRelatedType_related_type_mutual_follow {
			continue
		}
		if re2 == nil {
			re2 = &UserRelation{}
		}
		re1.FromID = Integer(cu.ID)
		re1.ToID = Integer(user.ID)
		re1.RelatedType = UserRelatedType_related_type_mutual_follow

		re2.FromID = Integer(user.ID)
		re2.ToID = Integer(cu.ID)
		re2.RelatedType = UserRelatedType_related_type_mutual_follow

		_, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
			UserRelation: re1,
		})
		if err != nil {
			return err
		}

		if _, err = Cl.UpsertRelation(context.TODO(), &PostRelationRequest{
			UserRelation: re2,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: 1,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    cu.ID,
			Value: 1,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFollowees(context.TODO(), &IncrementRequest{
			Id:    user.ID,
			Value: 1,
		}); err != nil {
			return err
		}

		if _, err = Cl.IncrementFollowers(context.TODO(), &IncrementRequest{
			Id:    user.ID,
			Value: 1,
		}); err != nil {
			return err
		}
	}
	return nil
}
