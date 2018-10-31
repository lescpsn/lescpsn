// This file "photo.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
)

type DB_Photo struct {
	Model
	User           *DB_User  `gorm:"ForeignKey:UserUUID"`
	UserUUID       uuid.UUID `sql:"not null;type:uuid" json:"-"`
	DisplayVersion *IntegerType
	Type           PhotoType    `sql:"not null"`
	InPipeline     *BooleanType `sql:"" json:"-"`
	Image          *DB_File     `gorm:"ForeignKey:ImageUUID" json:"-"`
	ImageUUID      uuid.UUID    `sql:"type:uuid" json:"-"`
	ImageURL       *StringType
	ImageSize      *IntegerType
	Width          *IntegerType `sql:"not null" json:"width,omitempty"`
	Height         *IntegerType `sql:"not null" json:"height,omitempty"`
	PrimaryColor   *StringType  `gorm:"column:primary_color" json:"-"`
	EditParams     *StringType  `sql:"default:'{}';type:json" json:"edit_params,omitempty"`
	Avatar         *BooleanType `sql:"default:false" json:"is_avatar"`
	Tuso           *BooleanType `sql:"default:false" json:"is_tuso"`
	RawPhoto       *DB_RawPhoto `gorm:"ForeignKey:RawPhotoUUID" json:"-"`
	RawPhotoUUID   uuid.UUID    `sql:"not null;type:uuid" json:"-"`
}

func (a *DB_Photo) TableName() string {
	return "photos"
}

// CRUD Method on Photo object, each method will contain validation on
// callers access, if not have enough access, a error will be returned

// NewPhoto method, Create method, Photo object require two
func NewPhoto(u *DB_User, width, height *IntegerType, primaryColor, ep *StringType, timestamp time.Time) *DB_Photo {
	i := &DB_Photo{
		User:         u,
		InPipeline:   Boolean(false),
		Width:        width,
		Height:       height,
		PrimaryColor: primaryColor,
		EditParams:   ep,
	}
	return i
}

func (i DB_Photo) Clone() *DB_Photo {
	i.Model = Model{}
	return &i
}

func (p *DB_Photo) removeExternalStructField() *DB_Photo {
	if p.User != nil {
		p.UserUUID = p.User.UUID
		p.User = nil
	}

	if p.Image != nil {
		p.ImageUUID = p.Image.UUID
		p.Image = nil
	}

	if p.RawPhoto != nil {
		p.RawPhotoUUID = p.RawPhoto.UUID
		p.RawPhoto = nil
	}

	return p
}

func (p *DB_Photo) copyExternalStructField(pc *DB_Photo) *DB_Photo {
	if pc.User != nil {
		p.User = pc.User
	}
	if pc.Image != nil {
		p.Image = pc.Image
	}
	if pc.RawPhoto != nil {
		p.RawPhoto = pc.RawPhoto
	}

	return p
}

func (p *DB_Photo) Save(DB *gorm.DB) (*DB_Photo, error) {
	pClone := *p
	p.removeExternalStructField()
	if err := DB.Save(&p).Error; err != nil {
		return nil, NewXFailError(err)
	}
	p = p.copyExternalStructField(&pClone)

	return p, nil
}

func (i *DB_Photo) SetDisplayVersion(v int64) *DB_Photo {
	i.DisplayVersion = Integer(v)
	return i
}

func (i *DB_Photo) SetInInPipeLine(b bool) *DB_Photo {
	i.InPipeline = Boolean(b)
	return i
}

func (i *DB_Photo) SetImage(f *DB_File) *DB_Photo {
	i.Image = f
	return i
}

func (i *DB_Photo) SetRawPhoto(rp *DB_RawPhoto) *DB_Photo {
	i.RawPhoto = rp
	return i
}

func (i *DB_Photo) GetRawPhoto(DB *gorm.DB) (*DB_RawPhoto, error) {
	o := i.RawPhoto
	if o == nil {
		var err error
		o, err = FirstRawPhotoByUUIDWithDel(DB, i.RawPhotoUUID, &RawPhotoQueryOptions{NilIfErrRecordNotFound: true})
		if err != nil {
			return nil, NewXFailError(err)
		}
	}
	return o, nil
}

func FirstPhotoByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_Photo, error) {
	var p DB_Photo
	if err := DB.Where(&DB_Photo{RawPhotoUUID: UUID}).Find(&p).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &p, nil
}

func FirstPhotoByFileUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_Photo, error) {
	var p DB_Photo
	if err := DB.Where(&DB_Photo{ImageUUID: UUID}).Find(&p).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &p, nil
}

func FirstPhotoByRPUUIDAndDVer(DB *gorm.DB, UUID uuid.UUID, dVersion int64) ([]*DB_Photo, error) {
	var is []*DB_Photo

	if err := DB.Where(&DB_Photo{RawPhotoUUID: UUID, DisplayVersion: Integer(dVersion)}).
		Find(&is).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return is, nil
}

func FindRawPhotosByPhotos(DB *gorm.DB, photos []*DB_Photo) ([]*DB_RawPhoto, error) {
	var ids []uuid.UUID

	for _, p := range photos {
		ids = append(ids, p.RawPhotoUUID)
	}

	var ps []*DB_RawPhoto
	if err := DB.Where("uuid in (?)", ids).Find(&ps).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return ps, nil
}

func FindPhotosByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID) ([]*DB_Photo, error) {
	var is []*DB_Photo

	if err := DB.Where("uuid in (?)", UUIDs).Find(&is).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return is, nil
}
