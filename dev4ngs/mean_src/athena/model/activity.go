package model

import (
	"gopkg.in/mgo.v2"
)

// CollectionName 方法, 返回 Activity 的 Collection
func GetActivityCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C("activity")
}

//ToData 输出Activity 的信息
func (ad Activity) ToData() (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = ad.ID
	d[`img_url`] = ad.ImgURL
	d[`title`] = ad.Title
	d[`mark`] = ad.Mark
	d[`timestamp`] = ad.Timestamp
	d["to_url"] = ad.ToURL
	return d, nil
}
