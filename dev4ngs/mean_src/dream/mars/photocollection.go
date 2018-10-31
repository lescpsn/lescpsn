//// This file "photocollection.go" is created by Lincan Li at 5/6/16.
//// Copyright © 2016 - Lincan Li. All rights reserved
//
package mars
// TODO 以现有的形式 2016.8.1 图说二期版本 完善所有代码
//import (
//	. "git.ngs.tech/mean/proto"
//	"github.com/jinzhu/gorm"
//	"time"
//)
//
//// A PhotoCollectionType shows type of an image collection
//// instance, it should indicates the general
//// category of image collection instance
//type PhotoCollectionType int
//
//const (
//	PhotoCollectionTypeTuso PhotoCollectionType = 1 + iota
//)
//
//// PhotoCollection data model represents a collection of images
//// or, in another words, image groups. With PhotoCollectionType,
//// PhotoCollection should be able to record any type of image
//// collection in system.
//type DB_PhotoCollection struct {
//	Model
//
//	User                *DB_User            `gorm:"ForeignKey:UserID" json:"-"`
//	UserID              *IntegerType        `sql:"not null"`
//	PhotoCollectionType PhotoCollectionType `sql:"not null"`
//	Photos              []*DB_RawPhoto      `sql:"-"`
//}
//
//func (a *DB_PhotoCollection) TableName() string {
//	return "photo_collections"
//}
//
//// PhotoCollectionPhotos data model represents a join table between
//// image collections and images
//type DB_PhotoCollectionPhotos struct {
//	PhotoCollectionID int64 `sql:"not null"`
//	RawPhotoID        int64 `sql:"not null"`
//	DisplayVersion    int64
//
//	CreatedAt time.Time
//	DeletedAt *time.Time `sql:"index"`
//}
//
//func (pcp *DB_PhotoCollectionPhotos) TableName() string {
//	return "photo_collections_photos"
//}
//
//func NewPhotoCollectionPhoto(DB *gorm.DB, pCollectionID, rpID, dVersion int64) *DB_PhotoCollectionPhotos {
//	ic := &DB_PhotoCollectionPhotos{
//		PhotoCollectionID: pCollectionID,
//		RawPhotoID:        rpID,
//		DisplayVersion:    dVersion,
//	}
//	return ic
//}
//
//func (pcp *DB_PhotoCollectionPhotos) Save(DB *gorm.DB) (*DB_PhotoCollectionPhotos, error) {
//	if err := DB.Save(&pcp).Error; err != nil {
//		return nil, NewXFailError(err)
//	}
//
//	return pcp, nil
//}
//
//// NewPhotoCollection 方法: 新建一个新的 PhotoCollection
//func NewPhotoCollection(DB *gorm.DB, userID int64, images []*DB_RawPhoto) *DB_PhotoCollection {
//	ic := &DB_PhotoCollection{
//		UserID: Integer(userID),
//		Photos: images,
//	}
//	return ic
//}
//
//func (ic *DB_PhotoCollection) removeExternalStructField() *DB_PhotoCollection {
//	if ic.User != nil {
//		ic.UserID = Integer(ic.User.ID)
//		ic.User = nil
//	}
//	return ic
//}
//
//func (ic *DB_PhotoCollection) copyExternalStructField(pc *DB_PhotoCollection) *DB_PhotoCollection {
//	if pc.User != nil {
//		ic.User = pc.User
//	}
//	return ic
//}
//
//func (ic *DB_PhotoCollection) Save(DB *gorm.DB) (*DB_PhotoCollection, error) {
//	icClone := *ic
//	ic.removeExternalStructField()
//
//	if err := DB.Save(&ic).Error; err != nil {
//		return nil, NewXFailError(err)
//	}
//	ic = ic.copyExternalStructField(&icClone)
//
//	return ic, nil
//}
//
//// GetPhotos: 方法: 获取 当前 PhotoCollection 内的所有图片
//func (pc *DB_PhotoCollection) GetPhotos(DB *gorm.DB) ([]*DB_RawPhoto, error) {
//	var pCollectionPhotos []*DB_PhotoCollectionPhotos
//
//	if err := DB.Where(DB_PhotoCollectionPhotos{PhotoCollectionID: pc.ID}).Find(&pCollectionPhotos).Error; err != nil {
//		return nil, NewXFailError(err)
//	}
//
//	var ids []int64
//	collectionMap := make(map[int64]*DB_PhotoCollectionPhotos)
//
//	for _, p := range pCollectionPhotos {
//		ids = append(ids, p.RawPhotoID)
//		collectionMap[p.RawPhotoID] = p
//	}
//
//	ps, err := FindRawPhotosByIDs(DB, ids, DefaultRawPhotoQueryOptions())
//	if err != nil {
//		return nil, err
//	}
//
//	for _, rp := range ps {
//		pCollectionPhoto := collectionMap[rp.ID]
//		rp.DisplayVersion = Integer((pCollectionPhoto.DisplayVersion))
//	}
//
//	return ps, nil
//}
//
//// GetPhotos 方法: 获取 当前 PhotoCollection 内的所有公开的图片
//func (ic *DB_PhotoCollection) GetPublicPhotos(DB *gorm.DB) ([]*DB_RawPhoto, error) {
//	ps, err := ic.GetPhotos(DB)
//	if err != nil {
//		return nil, err
//	}
//	var publicPhotos []*DB_RawPhoto
//	for _, p := range ps {
//		if p.PhotoPrivacy == PhotoPrivacy_photo_privacy_public {
//			publicPhotos = append(publicPhotos, p)
//		}
//	}
//	return publicPhotos, nil
//}
//
//// AddPhotos 方法: 添加图片列表至当前 PhotoCollection 中
//func (ic *DB_PhotoCollection) AddPhotos(DB *gorm.DB, is []*DB_RawPhoto) (*DB_PhotoCollection, error) {
//	for _, i := range is {
//		pcp := NewPhotoCollectionPhoto(DB, ic.ID, i.ID, int64(i.DisplayVersion.Int))
//		pcp.Save(DB)
//	}
//
//	return ic, nil
//}
//
//// ReplacePhotos 方法: 替换图片列表至 PhotoCollection 中
////func (ic *PhotoCollection) ReplacePhotos(DB *gorm.DB, is []*RawPhoto) (*PhotoCollection, error) {
////	if err := ic.associationModel(DB).Replace(is).Error; err != nil {
////		return nil, NewXFailError(err)
////	}
////	return ic, nil
////}
//
//// RemovePhotos 方法: 将列表图片冲 PhotoCollection 中删除
//func (ic *DB_PhotoCollection) RemovePhotos(DB *gorm.DB, is []*DB_RawPhoto) (*DB_PhotoCollection, error) {
//	var ids []int64
//
//	for _, p := range is {
//		ids = append(ids, p.ID)
//	}
//
//	if err := DB.Where("photo_collection_id = ? and raw_photo_id in (?)", ic.ID, ids).Delete(&DB_PhotoCollectionPhotos{}).Error; err != nil {
//		return nil, NewXFailError(err)
//	}
//	return ic, nil
//}
//
//// CountPhotos 方法: 返回当前 PhotoCollection 中有多少 Photo
//func (ic *DB_PhotoCollection) CountPhotos(DB *gorm.DB) (int, error) {
//	var pCollectionPhotos []*DB_PhotoCollectionPhotos
//
//	if err := DB.Where(DB_PhotoCollectionPhotos{PhotoCollectionID: ic.ID}).Find(&pCollectionPhotos).Error; err != nil {
//		return 0, NewXFailError(err)
//	}
//
//	var ids []int64
//	collectionMap := make(map[int64]*DB_PhotoCollectionPhotos)
//
//	for _, p := range pCollectionPhotos {
//		ids = append(ids, p.RawPhotoID)
//		collectionMap[p.RawPhotoID] = p
//	}
//
//	var count int
//	if err := DB.Where("id in (?)", ids).Count(&count).Error; err != nil {
//		return 0, NewXFailError(err)
//	}
//
//	return count, nil
//}
//
//// CountPhotos 方法: 返回当前 PhotoCollection 中有多少公开 Photo
//func (ic *DB_PhotoCollection) CountPublicPhotos(DB *gorm.DB) (int, error) {
//	ps, err := ic.GetPublicPhotos(DB)
//	if err != nil {
//		return 0, NewXFailError(err)
//	}
//
//	var publicPhotos []*DB_RawPhoto
//	for _, image := range ps {
//		if image.PhotoPrivacy == PhotoPrivacy_photo_privacy_public {
//			publicPhotos = append(publicPhotos, image)
//		}
//	}
//
//	return len(publicPhotos), nil
//}
