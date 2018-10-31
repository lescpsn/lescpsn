package huston

import (
	. "git.ngs.tech/mean/houston/model"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"time"
)

// NewActivity 方法: 创建活动
func (m *MeanController) NewActivity(ad *Activity) (Dungeons, error) {
	ad.ID = bson.NewObjectId()
	ad.Timestamp = time.Now().Format(time.RFC3339)
	err := GetActivityCollection(m.MDB).Insert(ad)
	if err != nil {
		return nil, err
	}
	return ad.ToData()
}

//FirstActivityByID 方法: 获取一条活动信息
func (m *MeanController) FirstActivityByID(id string) (Dungeons, error) {
	var ad Activity
	oid := bson.ObjectIdHex(id)
	if err := GetActivityCollection(m.MDB).FindId(oid).One(&ad); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return ad.ToData()
}

//FindActivity 方法: 根据条件查询列表信息
func (m *MeanController) FindActivity(sinceID, maxID string, pageSize int) ([]Dungeons, error) {

	var ads []*Activity
	bm := make(bson.M)
	_id := make(bson.M)

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

	qy := GetActivityCollection(m.MDB).Find(bm).Sort("-timestamp").Limit(pageSize)

	if err := qy.All(&ads); err != nil {
		return nil, err
	}

	ds := []Dungeons{}
	for _, t := range ads {

		d, err := t.ToData()

		if err != nil {
			return ds, err
		}
		ds = append(ds, d)
	}
	return ds, nil
}

//DeleteActivity 删除活动
func (m *MeanController) DeleteActivity(id string) (bool, error) {
	err := GetActivityCollection(m.MDB).RemoveId(bson.ObjectIdHex(id))
	if err != nil {
		return false, err
	}
	return true, nil

}

//UpdateActivity 方法:根据id修改内容
func (m *MeanController) UpdateActivity(ID string, ac Activity) (bool, error) {
	ad := Activity{}
	err := GetActivityCollection(m.MDB).FindId(bson.ObjectIdHex(ID)).One(&ad)

	if err != nil {
		return false, err
	}

	if ac.ToURL != "" {
		ad.ToURL = ac.ToURL
	}
	if ac.ImgURL != "" {
		ad.ImgURL = ac.ImgURL
	}
	if ac.Mark != "" {
		ad.Mark = ac.Mark
	}
	if ac.Title != "" {
		ad.Title = ac.Title
	}

	err = GetActivityCollection(m.MDB).UpdateId(ad.ID, ad)
	if err != nil {
		return false, err
	}
	return true, nil

}
