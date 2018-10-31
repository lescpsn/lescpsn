// This file "diarymixphoto.go" is created by hengjun che at 2016/06/15
// Copyright Nanjing Negative Space Tech LLC. All rights reserved.
// Package models provides data model definition in Tuso project
package huston

import (
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	"gopkg.in/mgo.v2/bson"
	"time"
)

const (
	DataTypeDiary = "DataTypeDiary"
	DataTypePhoto = "DataTypePhoto"
)

type Diarymixphoto struct {
	ID        bson.ObjectId `json:"id" bson:"_id,omitempty"`
	UserUUID  string        `bson:"user_uuid"`
	Timestamp string        `bson:"timestamp"`
	Datatype  string        `bson:"data_type"` // "DataTypeDiary" | "DataTypePhoto" 两种类型
	Data      Dungeons      `bson:"data"`
}

//ToData 输出 Diarymixphoto 的信息
func (dmp Diarymixphoto) ToData(m *MeanController) (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = dmp.ID
	d[`user_uuid`] = dmp.UserUUID
	d[`timestamp`] = dmp.Timestamp
	d[`data_type`] = dmp.Datatype

	switch dmp.Datatype {
	case DataTypeDiary:
		ds, err := m.GetDiaryByUUID(dmp.Data[`uuid`].(string))
		fmt.Println("********t103.1:", ds)
		if err != nil {
			return nil, err
		}
		d[`data`] = ds
		break
	case DataTypePhoto:
		ds, err := m.GetPhotoDataByUUID(m.User, Str2UUID(dmp.Data[`uuid`].(string)))
		fmt.Println("********t103.2:", ds)
		if err != nil {
			return nil, err
		}
		d[`data`] = ds
		break
	default:
		break

	}

	return d, nil
}

//ToData 输出 Diarymixphoto 的信息
func (dmp Diarymixphoto) ToData2() (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = dmp.ID
	d[`user_uuid`] = dmp.UserUUID
	d[`timestamp`] = dmp.Timestamp
	d[`data_type`] = dmp.Datatype
	d[`data`] = dmp.Data
	return d, nil
}

// InsertDiaryMixPhotoFromDiary 方法: 从日记和相片入口往mongodb里插入数据
func (m *MeanController) InsertDiaryMixPhoto(d *Diarymixphoto) {
	DiarymixphotoCollection(m.MDB).Insert(d)
}

// mongodb 中创建日记文档记录
func (m *MeanController) NewDiarymixphotoByDiary(d *Diary) *Diarymixphoto {
	/*diary insert test
	datat := make(Dungeons)
	datat[`id`] = 20001
	datat[`uuid`] = "30001"
	datat[`privacy`] = DiaryPrivacyPublic.String()
	datat[`status`] = DiaryStatusPublished.String()
	dmt := Diarymixphoto{
		ID:        bson.NewObjectId(),
		UserUUID:  "10001",
		Timestamp: time.Now().Format(time.RFC3339),
		Datatype:  DataTypeDiary,
		Data:      datat,
	}
	return &dmt
	*/

	dm := Diarymixphoto{}
	dm.ID = bson.NewObjectId()
	dm.UserUUID = d.UserUUID
	dm.Timestamp = time.Now().Format(time.RFC3339)
	dm.Datatype = DataTypeDiary

	data := make(Dungeons)
	data[`id`] = d.ID
	data[`uuid`] = d.UUID
	data[`privacy`] = d.DiaryPrivacy.String()
	data[`status`] = d.DiaryStatus.String()
	dm.Data = data

	return &dm
}

// mongodb 中创建图片文档记录
func (m *MeanController) NewDiarymixphotoByPhoto(user_uuid string, data_uuid, data_privacy string, data_id int64) *Diarymixphoto {
	/* photo insert test
	datat := make(Dungeons)
	datat[`id`] = 20001
	datat[`uuid`] = "30001"
	datat[`privacy`] = PhotoPrivacyPublic.String()
	dmt := Diarymixphoto{
		ID:        bson.NewObjectId(),
		UserUUID:  "10001",
		Timestamp: time.Now().Format(time.RFC3339),
		Datatype:  DataTypeDiary,
		Data:      datat,
	}
	return &dmt
	*/

	dm := Diarymixphoto{}
	dm.ID = bson.NewObjectId()
	dm.UserUUID = user_uuid
	dm.Timestamp = time.Now().Format(time.RFC3339)
	dm.Datatype = DataTypePhoto

	data := make(Dungeons)
	data[`id`] = data_id
	data[`uuid`] = data_uuid
	data[`privacy`] = data_privacy
	dm.Data = data
	return &dm
}

// UpdateDiaryMixPhoto4Diary 方法: 根据日志id获取修改日志信息
func (m *MeanController) UpdateDiaryMixPhoto4Diary(ID int64, d *Diary) {
	DiarymixphotoCollection(m.MDB).Update(bson.M{"data.id": ID}, bson.M{
		"$set": bson.M{"data": d}})
}

// UpdateDiaryMixPhoto4Photo 方法: 根据用户图片UUID更新图片状态信息
func (m *MeanController) UpdateDiaryMixPhoto4Photo(UUIDS []string, PRIVACY string) {
	for _, UUID := range UUIDS {
		DiarymixphotoCollection(m.MDB).Update(bson.M{"data.uuid": UUID}, bson.M{
			"$set": bson.M{"data.privacy": PRIVACY}})
	}
}

// DeleteDiaryByID 方法: 根据id删除日记
func (m *MeanController) DelDiaryMixPhotoByID(ID int64, datatype string) {
	DiarymixphotoCollection(m.MDB).RemoveAll(bson.M{"data.id": ID, "data_type": datatype})
}

// DeleteDiaryByUUID 方法: 根据uuid删除日记或者图片
func (m *MeanController) DelDiaryMixPhotoByUUID(UUID string, datatype string) {
	DiarymixphotoCollection(m.MDB).RemoveAll(bson.M{"data.uuid": UUID, "data_type": datatype})
}

//GetDiaryMixPhotoByUserID 方法: 根据条件查询列表信息
func (m *MeanController) GetDiaryMixPhotoByUserUUID(useruuid, id string, pageSize int, isDropRefresh bool) ([]Dungeons, error) {
	var dmp []*Diarymixphoto
	bm := bson.M{}
	fmt.Println("********t101:", useruuid, id, pageSize, isDropRefresh)
	if id == "" {
		bm = bson.M{"user_uuid": useruuid, "$or": []bson.M{bson.M{"data.privacy": DiaryPrivacyPublic.String(), "data.status": DiaryStatusPublished.String()}, bson.M{"data.privacy": PhotoPrivacyPublic.String()}}}
	} else {
		oid := bson.ObjectIdHex(id)
		if isDropRefresh {
			bm = bson.M{
				"_id":       bson.M{"$gt": oid},
				"user_uuid": useruuid,
				"$or": []bson.M{
					bson.M{
						"data.privacy": DiaryPrivacyPublic.String(),
						"data.status":  DiaryStatusPublished.String(),
					},
					bson.M{
						"data.privacy": PhotoPrivacyPublic.String(),
					},
				}}
		} else {
			bm = bson.M{
				"_id":       bson.M{"$lt": oid},
				"user_uuid": useruuid,
				"$or": []bson.M{
					bson.M{
						"data.privacy": DiaryPrivacyPublic.String(),
						"data.status":  DiaryStatusPublished.String(),
					},
					bson.M{
						"data.privacy": PhotoPrivacyPublic.String(),
					},
				}}
		}
	}

	fmt.Println("********t102:", bm)
	qy := DiarymixphotoCollection(m.MDB).Find(bm).Sort("timestamp:-1").Limit(pageSize)

	if err := qy.All(&dmp); err != nil {
		return nil, err
	}

	diary_uuids := []string{} // 将mongodb中多条数据uuid组装成数组uuids,用uuids数组一次查询
	photo_uuids := []string{}
	for _, t := range dmp {
		data_uuid := t.Data[`uuid`].(string)
		switch t.Datatype {
		case DataTypeDiary:
			diary_uuids = append(diary_uuids, data_uuid)
		case DataTypePhoto:
			photo_uuids = append(photo_uuids, data_uuid)
		}
	}

	dataMap := Dungeons{}
	if len(diary_uuids) != 0 {
		ds, err := m.GetDiaryByUUIDs(diary_uuids)
		if err!=nil {
			return nil, err
		}
		for _, t := range ds {
			dataMap[t[`uuid`].(string)] = t
		}
	}
	if len(photo_uuids) != 0 {
		ps, err := DCenter.FindPhotoByUUIDs(photo_uuids, &PhotoEchoOption{FetchNote: true})
		if err!=nil {
			return nil, err
		}
		for _, t := range ps {
			//dataMap[t[`uuid`].(string)] = t
			dataMap[t.UUID] = t
			//dataMap[t[`uuid`].] = t

		}

	}

	ds := []Dungeons{}
	for _, t := range dmp {
		data_uuid := t.Data[`uuid`].(string)
		t.Data = dataMap[data_uuid].(Dungeons)
		d, err := t.ToData2()
		if err != nil {
			continue
		}
		ds = append(ds, d)
	}

	return ds, nil
}
