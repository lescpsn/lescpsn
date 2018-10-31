package huston

import (
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"strings"
	"time"
)

// NewAccountDynamics 方法: 创建帐户动态
func (m *MeanController) NewAccountDynamics(ad *AccountDynamics) (Dungeons, error) {
	ad.DymsStatus = DynamicsStatusUnread
	ad.ID = bson.NewObjectId()
	err := GetAccountDynamicsCollection(m.MDB).Insert(ad)
	if err != nil {
		return nil, err
	}
	return ad.ToData()
}

//FirstAccountDynamicsByUUID 方法: 获取一条动态信息
func (m *MeanController) FirstAccountDynamicsByUUID(id string) (Dungeons, error) {
	var ad AccountDynamics
	oid := bson.ObjectIdHex(id)
	if err := GetAccountDynamicsCollection(m.MDB).FindId(oid).One(&ad); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return ad.ToData()
}

//FindAccountDynamics 方法: 根据条件查询列表信息
func (m *MeanController) FindAccountDynamics(useruuid, sinceID, maxID string, StatusString string, pageSize int) (Dungeons, error) {

	if m.User.UUID != useruuid {

		return nil, AuthErr
	}

	var ads []*AccountDynamics
	bm := make(bson.M)
	_id := make(bson.M)
	bm["user_uuid"] = useruuid
	if StatusString != "" {
		status, err := Str2DynamicsStatus(StatusString)
		if err != nil {
			panic(err)
		}
		bm["dyms_status"] = status
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

	qy := GetAccountDynamicsCollection(m.MDB).Find(bm)
	_, exist := _id["$gt"]
	_, exist1 := _id["$lt"]

	mcount, _ := qy.Count()

	if exist && !exist1 && mcount > pageSize {

		qy = qy.Sort("-timestamp").Limit(pageSize)

	} else {

		qy = qy.Limit(pageSize).Sort("-timestamp")
	}

	if err := qy.All(&ads); err != nil {
		return nil, err
	}

	uuids := []string{} //取出要查询用户的uuid数组
	for _, t := range ads {
		usrsd := t.UserRelation["target_user"].(Dungeons) //拿到mongo中的用户数据
		uuids = append(uuids, usrsd["uuid"].(string))
	}
	uRsp, err := Cl.GetUserByUUIDs(context.TODO(), &GetByUUIDsRequest{
		UUIDs: uuids,
	})
	usrs := uRsp.User
	if err != nil {
		return nil, err
	}

	usrsMap := Dungeons{} //将查询出来的数据通过 uuid为key,user为value的方式组成map
	for _, t := range usrs {
		usr, _ := UserToData(t, &UserDataOption{FillSensitive: true, DynamicData: true})
		usrsMap[t.UUID] = usr
	}

	ds := []Dungeons{}
	for _, t := range ads {

		usrsd := t.UserRelation["target_user"].(Dungeons) //拿到mongo中的用户数据

		t.UserRelation["target_user"] = usrsMap[usrsd["uuid"].(string)] //从map中获取user信息

		d, err := t.ToData()

		if err != nil {

			continue
		}
		ds = append(ds, d)
	}

	result := make(Dungeons)
	result["new_row_count"] = mcount
	result["data_list"] = ds

	return result, nil
}

//DeleteAccountDynamics 删除帐户动态
func (m *MeanController) DeleteAccountDynamics(id string) (bool, error) {
	err := GetAccountDynamicsCollection(m.MDB).RemoveId(bson.ObjectIdHex(id))
	if err != nil {
		return false, err
	}
	return true, nil

}

//MakeAccountDynamicsRead 将消息帐设置为已读
func (m *MeanController) MakeAccountDynamicsRead(id string) (bool, error) {
	var ad AccountDynamics
	oid := bson.ObjectIdHex(id)
	if err := GetAccountDynamicsCollection(m.MDB).FindId(oid).One(&ad); err != nil {
		if err == mgo.ErrNotFound {
			return false, nil
		}
		return false, err
	}
	ad.DymsStatus = DynamicsStatusRead
	err := GetAccountDynamicsCollection(m.MDB).UpdateId(oid, ad)
	if err != nil {
		return false, err
	}
	return true, nil
}

//UpsertAccountDynamicsByRelation 方法:根据relationid修改动态内容
func (m *MeanController) UpsertAccountDynamicsByRelation(ur *UserRelation, message, relatio_type, ObjectId string) (bool, error) {
	ad := AccountDynamics{}
	//bm := bson.M{"user_rel.id": ur.ID}

	usrRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
		Id: ur.FromID.GetInt(),
	})
	ad.UserUUID = usrRsp.User.UUID

	ruRsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
		Id: ur.ToID.GetInt(),
	})

	if err != nil {
		return false, err
	}
	if ruRsp.Null {
		return false, err
	}
	ru := ruRsp.User

	if message != "" {
		ad.Mark = message
	}
	ad.DymsStatus = DynamicsStatusUnread
	ad.UserRelation, err = RelationToData(ur, ru, &UserDataOption{LiteData: true})
	ad.Type = relatio_type

	if strings.EqualFold(relatio_type, MESSAGE_TYPE_RELATION_REFUSE) {
		ad.DymsStatus = DynamicsStatusRead
	}

	delete(ad.UserRelation, "is_applying_friend")

	if ObjectId != "" {
		ads := AccountDynamics{}
		id := bson.ObjectIdHex(ObjectId)
		if err := GetAccountDynamicsCollection(m.MDB).Find(bson.M{"_id": id}).One(&ads); err != nil {
			if err == mgo.ErrNotFound {
				_, err := m.NewAccountDynamics(&ad)
				if err != nil {
					return false, err
				}
				return true, nil
			}
		}
		if err != nil {
			return false, err
		}
		ad.Timestamp = ads.Timestamp
		err = GetAccountDynamicsCollection(m.MDB).UpdateId(id, &ad)
		if err != nil {
			return false, err
		}
		return true, nil
	}

	ad.Timestamp = time.Now().Format(time.RFC3339)
	_, err = m.NewAccountDynamics(&ad)
	if err != nil {
		return false, err
	}
	return true, nil

}
