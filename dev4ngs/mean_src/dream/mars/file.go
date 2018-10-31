// This file "file.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
)

// File data model
type DB_File struct {
	Model
	User           *DB_User  `gorm:"ForeignKey:UserUUID"`
	UserUUID       uuid.UUID `sql:"not null;type:uuid" json:"-"`
	Bucket         *StringType
	Key            *StringType
	Size           *IntegerType
	PersistentID   *StringType
	PersistentType PersistentType
}

func (a *DB_File) TableName() string {
	return "files"
}

func NewFile(b, key *StringType, fsize *IntegerType) *DB_File {
	f := &DB_File{
		Bucket: b,
		Key:    key,
		Size:   fsize,
	}
	return f
}

func NewPersistentFile(bucket, key, pID *StringType, PType PersistentType) *DB_File {
	f := &DB_File{
		Bucket:         bucket,
		Key:            key,
		PersistentID:   pID,
		PersistentType: PType,
	}
	return f
}

func (f *DB_File) SetPersistentID(pID *StringType) *DB_File {
	f.PersistentID = pID
	return f
}

func (f *DB_File) SetPersistentType(pType PersistentType) *DB_File {
	f.PersistentType = pType
	return f
}

func (f *DB_File) Save(DB *gorm.DB) (*DB_File, error) {
	if err := DB.Save(&f).Error; err != nil {
		return nil, err
	}
	return f, nil
}

func (f *DB_File) GetPhoto(X *gorm.DB) ([]*DB_Photo, error) {
	var ps []*DB_Photo
	if err := X.Where("image_id = ?", f.ID).Preload("User").Find(&ps).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	for _, p := range ps {
		p.Image = f
		p.ImageUUID = f.UUID
	}

	return ps, nil
}

func FirstFileByPersistentID(X *gorm.DB, pID string) (*DB_File, error) {
	var f DB_File
	if err := X.Where("persistent_id = ?", pID).Find(&f).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &f, nil
}

func FirstFileByID(DB *gorm.DB, ID int64) (*DB_File, error) {
	var note DB_File
	if err := DB.Where("id = ?", ID).First(&note).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &note, nil
}

func FirstFileByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_File, error) {
	var file DB_File
	if err := DB.Where("uuid = ?", UUID.String()).First(&file).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &file, nil
}

func FindFilesByIDs(DB *gorm.DB, ID []int64) ([]*DB_File, error) {
	var file []*DB_File
	if err := DB.Where("id IN (?)", ID).Find(file).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return file, nil
}

func FindFilesByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID) ([]*DB_File, error) {
	var files []*DB_File
	if err := DB.Where("uuid IN (?)", UUIDs).Find(files).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return files, nil
}

func FindFileByUserUUID(DB *gorm.DB, uUUID uuid.UUID, options *QueryParameter) ([]*DB_File, error) {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}

	query := DB.Where(&DB_File{UserUUID: uUUID})

	if options.MaxID != 0 {
		query = query.Where("id < ?", options.MaxID)

	}
	if options.SinceID != 0 {
		query = query.Where("id > ?", options.SinceID)
	}

	if options.Page != 0 {
		var offset int32 = options.Page * count
		query.Offset(int(offset))
	}

	query.Limit(int(count)).Order("id desc")

	var files []*DB_File
	if err := query.Find(&files).Error; err != nil {
		return nil, err
	}

	return files, nil

}

func (f *DB_File) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&f).Error; err != nil {
		return NewXFailError(err)
	}

	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	now := time.Now()
	f.DeletedAt = &now

	return nil
}
