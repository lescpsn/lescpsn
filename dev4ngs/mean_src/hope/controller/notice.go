package controller

import (
	"git.ngs.tech/mean/hope/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

// NewAccountDynamics 方法: 创建帐户动态
func (m *MeanController) NewNotice(nn *model.Notice) (model.Dungeons, error) {
	nn.Status = NoticStatus_Unread
	nn.ID = bson.NewObjectId()
	err := model.GetNoticeCollection(m.MDB).Insert(nn)
	if err != nil {
		return nil, err
	}
	return nn.ToData(m.MDB)
}

//FirstAccountDynamicsByUUID 方法: 获取一条动态信息
func (m *MeanController) FirstNoticeByUUID(id string) (model.Dungeons, error) {
	var nn model.Notice
	oid := bson.ObjectIdHex(id)
	if err := model.GetNoticeCollection(m.MDB).FindId(oid).One(&nn); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return nn.ToData(m.MDB)
}

//FindAccountDynamics 方法: 根据条件查询列表信息
func (m *MeanController) FindNotices(sinceID, maxID string, status int, pageSize int) (model.Dungeons, error) {
	var ns []*model.Notice
	bm := make(bson.M)
	_id := make(bson.M)
	bm["Type"] = bson.M{
		"$in":[]string{
			model.MESSAGE_TYPE_SYSTEM,
			model.MESSAGE_TYPE_RELATION_WAS_FOLLOW,
			model.MESSAGE_TYPE_RELATION_WAS_AGREED,

		},
	}
	bm["to_id"] = m.User.ID
	if sinceID != "" {
		oid := bson.ObjectIdHex(sinceID)
		_id["$gt"] = oid
		bm["_id"] = _id
	}
	if maxID != "" {
		oid := bson.ObjectIdHex(maxID)
		_id["$lt"] = oid
		bm["_id"] = _id
	}

	qy := model.GetNoticeCollection(m.MDB).Find(bm)
	_, exist := _id["$gt"]
	_, exist1 := _id["$lt"]

	mcount, _ := qy.Count()
	if exist && !exist1 && mcount > pageSize {
		qy = qy.Sort("-timestamp").Limit(pageSize)
	} else {
		qy = qy.Limit(pageSize).Sort("-timestamp")
	}
	err := qy.All(&ns)
	if err == mgo.ErrNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var ids []int64
	for _, v := range ns {
		ids = append(ids, v.FromID)
	}

	uRsp, err := Cl.GetUserByIDs(context.TODO(), &GetByIDsRequest{
		Ids: ids,
	})
	usrs := uRsp.User
	if err != nil {
		return nil, err
	}
	for _, v := range usrs {
		for kk, vv := range ns {
			if v.ID == vv.FromID {
				ns[kk].FromUser = v
			}
		}
	}
	ds := []model.Dungeons{}
	for _, t := range ns {
		d, err := t.ToData(m.MDB)
		if err != nil {
			continue
		}
		ds = append(ds, d)
	}
	result := make(model.Dungeons)
	result["new_row_count"] = mcount
	result["list"] = ds
	return result, nil
}


//FindAccountDynamics 方法: 根据条件查询列表信息
func (m *MeanController) FindMyNotices(sinceID, maxID string, status int, pageSize int) (model.Dungeons, error) {
	var ns []*model.Notice
	bm := make(bson.M)
	_id := make(bson.M)
	bm["to_id"] = m.User.ID
	bm["Type"] = bson.M{
		"$in":[]string{
			model.MESSAGE_TYPE_RELATION_APPLIED,
			model.MESSAGE_TYPE_RELATION_WAS_APPLIED,
			model.MESSAGE_TYPE_STARRED_NEWS,
			model.MESSAGE_TYPE_COMMENT_NEWS,
			model.MESSAGE_TYPE_COMMENT_IMAGES,
		},
	}
	if sinceID != "" {
		oid := bson.ObjectIdHex(sinceID)
		_id["$gt"] = oid
		bm["_id"] = _id
	}
	if maxID != "" {
		oid := bson.ObjectIdHex(maxID)
		_id["$lt"] = oid
		bm["_id"] = _id
	}

	qy := model.GetNoticeCollection(m.MDB).Find(bm)
	_, exist := _id["$gt"]
	_, exist1 := _id["$lt"]

	mcount, _ := qy.Count()
	if exist && !exist1 && mcount > pageSize {
		qy = qy.Sort("-timestamp").Limit(pageSize)
	} else {
		qy = qy.Limit(pageSize).Sort("-timestamp")
	}
	err := qy.All(&ns)
	if err == mgo.ErrNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var ids []int64
	for _, v := range ns {
		ids = append(ids, v.FromID)
	}

	uRsp, err := Cl.GetUserByIDs(context.TODO(), &GetByIDsRequest{
		Ids: ids,
	})
	usrs := uRsp.User
	if err != nil {
		return nil, err
	}
	for _, v := range usrs {
		for kk, vv := range ns {
			if v.ID == vv.FromID {
				ns[kk].FromUser = v
			}
		}
	}
	ds := []model.Dungeons{}
	for _, t := range ns {
		d, err := t.ToData(m.MDB)
		if err != nil {
			continue
		}
		ds = append(ds, d)
	}
	result := make(model.Dungeons)
	result["new_row_count"] = mcount
	result["list"] = ds
	return result, nil
}

//DeleteAccountDynamics 删除帐户动态
func (m *MeanController) DeletNotic(id string) (bool, error) {
	err := model.GetNoticeCollection(m.MDB).RemoveId(bson.ObjectIdHex(id))
	if err != nil {
		return false, err
	}
	return true, nil

}

//MakeAccountDynamicsRead 将消息帐设置为已读
func (m *MeanController) MarkNoticeRead(id string) (bool, error) {
	var ns Notice
	oid := bson.ObjectIdHex(id)
	if err := model.GetNoticeCollection(m.MDB).FindId(oid).One(&ns); err != nil {
		//if err == mgo.ErrNotFound {
		//	return false, nil
		//}
		return false, err
	}
	ns.Status = NoticStatus_Read
	err := model.GetNoticeCollection(m.MDB).UpdateId(oid, ns)
	if err != nil {
		return false, err
	}
	return true, nil
}

//UpsertAccountDynamicsByRelation 方法:根据relationid修改动态内容
//func (m *MeanController) UpsertAccountDynamicsByRelation(ur *UserRelation, message, relatio_type, ObjectId string) (bool, error) {
//	ad := AccountDynamics{}
//	//bm := bson.M{"user_rel.id": ur.ID}
//	usrRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
//		Id: ur.FromID.GetInt(),
//	})
//	ad.UserUUID = usrRsp.User.UUID
//
//	ruRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
//		Id: ur.ToID.GetInt(),
//	})
//
//	if err != nil {
//		return false, err
//	}
//	if ruRsp.Null {
//		return false, err
//	}
//	ru := ruRsp.User
//
//	if message != "" {
//		ad.Mark = message
//	}
//	ad.DymsStatus = DynamicsStatusUnread
//	usrla, err := huModel.RelationToData(ur, ru, &huModel.UserDataOption{LiteData: true})
//	var usrl interface{} = usrla
//	ad.UserRelation = (usrl).(Dungeons)
//	ad.Type = relatio_type
//
//	if strings.EqualFold(relatio_type, MESSAGE_TYPE_RELATION_REFUSE) {
//		ad.DymsStatus = DynamicsStatusRead
//	}
//
//	delete(ad.UserRelation, "is_applying_friend")
//
//	if ObjectId != "" {
//		ads := AccountDynamics{}
//		id := bson.ObjectIdHex(ObjectId)
//		if err := GetNoticeCollection(m.MDB).Find(bson.M{"_id": id}).One(&ads); err != nil {
//			if err == mgo.ErrNotFound {
//				_, err := m.NewAccountDynamics(&ad)
//				if err != nil {
//					return false, err
//				}
//				return true, nil
//			}
//		}
//		if err != nil {
//			return false, err
//		}
//		ad.Timestamp = ads.Timestamp
//		err = GetNoticeCollection(m.MDB).UpdateId(id, &ad)
//		if err != nil {
//			return false, err
//		}
//		return true, nil
//	}
//
//	ad.Timestamp = time.Now().Format(time.RFC3339)
//	_, err = m.NewAccountDynamics(&ad)
//	if err != nil {
//		return false, err
//	}
//	return true, nil
//}
