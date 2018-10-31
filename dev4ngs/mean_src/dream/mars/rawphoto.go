// This file "rawphoto.go" is created by Lincan Li at 2/18/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
	"fmt"
)

// Photo data model, image data model contain information
// regarding any image file stored in our system.
//
// Photo data model contain a key named "GeoLocation", in current system
// capability and corresponding spec, the key is stored as
// json, yet in future, it should be stored as ST_GeomFromText
// for more information please consider
// http://postgis.net/docs/manual-2.2/using_postgis_dbmanagement.html
type DB_RawPhoto struct {
	Model
	User             *DB_User     `gorm:"ForeignKey:UserUUID"`
	UserUUID         uuid.UUID    `sql:"not null;type:uuid" json:"-"`
	BasePhoto        *DB_Photo    `gorm:"ForeignKey:BasePhotoUUID"`
	BasePhotoUUID    uuid.UUID    `sql:"type:uuid"`
	InPipeline       *BooleanType ``
	Identifier       *StringType  `sql:"not null" json:"-"`
	PhotoPrivacy     PhotoPrivacy `sql:"not null" json:"image_type,omitempty"`
	GeoLocation      *StringType  `sql:"default:'{}';type:json" json:"geo_location,omitempty"`
	Exif             *StringType  `sql:"default:'{}';type:json" json:"exif,omitempty"`
	Note             *DB_Note     `gorm:"ForeignKey:NoteUUID" json:"-"`
	NoteUUID         uuid.UUID    `sql:"default:null;type:uuid" json:"-"`
	DisplayPhoto     *DB_Photo    `gorm:"ForeignKey:DisplayPhotoUUID"`
	DisplayPhotoUUID uuid.UUID    `sql:"type:uuid"`
	DisplayVersion   *IntegerType `sql:"default:0" json:"-"`
	CommentsCount    *IntegerType `sql:"default:0"`
	Timestamp        time.Time    `sql:"not null" json:"timestamp,omitempty"`
}

func (a *DB_RawPhoto) TableName() string {
	return "raw_photos"
}

func NewRawPhoto(u *DB_User, iType PhotoPrivacy, width, height *IntegerType, primaryColor, geoLocation, Identifier, exif *StringType, timestamp time.Time) *DB_RawPhoto {
	i := &DB_RawPhoto{
		User:         u,
		InPipeline:   Boolean(false),
		PhotoPrivacy: iType,
		GeoLocation:  geoLocation,
		Identifier:   Identifier,
		Exif:         exif,
		Timestamp:    timestamp,
	}
	return i
}

func (p *DB_RawPhoto) removeExternalStructField() *DB_RawPhoto {
	if p.User != nil {
		p.UserUUID = p.User.UUID
		p.User = nil
	}
	if p.DisplayPhoto != nil {
		p.DisplayPhotoUUID = p.DisplayPhoto.UUID
		p.DisplayPhoto = nil
	}
	if p.Note != nil {
		p.NoteUUID = p.Note.UUID
		p.Note = nil
	}
	return p
}

func (p *DB_RawPhoto) copyExternalStructField(pc *DB_RawPhoto) *DB_RawPhoto {
	if pc.User != nil {
		p.User = pc.User
	}
	if pc.DisplayPhoto != nil {
		p.DisplayPhoto = pc.DisplayPhoto
	}
	if pc.Note != nil {
		p.Note = pc.Note
	}

	return p
}

// Save 方法: 保存
func (p *DB_RawPhoto) Save(DB *gorm.DB) (*DB_RawPhoto, error) {
	pClone := *p
	p.removeExternalStructField()
	if err := DB.Save(&p).Error; err != nil {
		return nil, NewXFailError(err)
	}
	p = p.copyExternalStructField(&pClone)
	return p, nil
}

// Delete 方法: 删除当前对象, 软删除.
func (i *DB_RawPhoto) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&i).Error; err != nil {
		return NewXFailError(err)
	}

	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	now := time.Now()
	i.DeletedAt = &now

	return nil
}

// Clone 方法: 克隆当前对象
func (i DB_RawPhoto) Clone() *DB_RawPhoto {
	i.Model = Model{}
	return &i
}

func (i *DB_RawPhoto) SetDisplayVersion(dVersion int64) *DB_RawPhoto {
	i.DisplayVersion = Integer(dVersion)
	return i
}

func (i *DB_RawPhoto) Increment(DB *gorm.DB, key string, a int64) error {
	if err := DB.Model(i).UpdateColumn(key, gorm.Expr(key+" + ?", a)).Error; err != nil {
		return NewXFailError(err)
	}
	return nil
}

func (i *DB_RawPhoto) IncrementDisplayVersion(DB *gorm.DB, a int64) error {
	if err := i.Increment(DB, "display_version", a); err != nil {
		return NewXFailError(err)
	}
	i.DisplayVersion.Int += a
	return nil
}

func (p *DB_RawPhoto) GetBasePhoto(DB *gorm.DB) (*DB_Photo, error) {
	if p.BasePhoto != nil {
		return p.BasePhoto, nil
	}
	var BaseImage DB_Photo
	if err := DB.Model(&p).Related(&BaseImage, "BaseImage").Error; err != nil {
		return nil, NewXFailError(err)
	}
	p.BasePhoto = &BaseImage
	return &BaseImage, nil
}

// GetURL method, Get Photo Url
func (p *DB_RawPhoto) GetBasePhotoURL(DB *gorm.DB) (string, error) {
	_, err := p.GetBasePhoto(DB)
	if err != nil {
		return "", NewXFailError(err)
	}

	return p.BasePhoto.ImageURL.GetString(), nil
}

func (i *DB_RawPhoto) SetDisplayPhoto(p *DB_Photo) *DB_RawPhoto {
	i.DisplayPhoto = p
	return i
}

func (i *DB_RawPhoto) GetDisplayPhoto(DB *gorm.DB) (*DB_Photo, error) {
	if i.DisplayPhoto != nil {
		return i.DisplayPhoto, nil
	}
	var dPhoto DB_Photo
	if err := DB.Model(&i).Related(&dPhoto, "DisplayPhoto").Error; err != nil {
		return nil, NewXFailError(err)
	}
	i.DisplayPhoto = &dPhoto
	return &dPhoto, nil

}

func (i *DB_RawPhoto) GetDisplayPhotoWithVersion(DB *gorm.DB, dVersion int64) (*DB_Photo, error) {
	var dPhoto DB_Photo
	if err := DB.Where(DB_Photo{RawPhotoUUID: i.UUID, DisplayVersion: Integer(dVersion)}).First(&dPhoto).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &dPhoto, nil

}

func (p *DB_RawPhoto) GetDisplayImageURL(DB *gorm.DB) (string, error) {
	dPhoto, err := p.GetDisplayPhoto(DB)
	if err != nil {
		return "", err
	}

	return dPhoto.ImageURL.GetString(), nil
}

func (p *DB_RawPhoto) GetDisplayImageSize(DB *gorm.DB) (int64, error) {
	dPhoto, err := p.GetDisplayPhoto(DB)
	if err != nil {
		return 0, err
	}
	return dPhoto.ImageSize.Int, nil
}

func (p *DB_RawPhoto) GetDisplayImageDimension(DB *gorm.DB) (int64, int64, error) {
	dPhoto, err := p.GetDisplayPhoto(DB)
	if err != nil {
		return 0, 0, err
	}
	return dPhoto.Width.Int, dPhoto.Height.Int, nil
}

func (i *DB_RawPhoto) LoadUserIfNecessary(DB *gorm.DB) (*DB_RawPhoto, error) {
	if i.User != nil {
		return i, nil
	}

	var u DB_User
	if err := DB.Where("uuid = ?", i.UserUUID).First(&u).Error; err != nil {
		return nil, NewXFailError(err)
	}
	i.User = &u

	return i, nil
}

type RawPhotoToDataOptions struct {
	FetchLeanData   bool
	FetchNestedData bool
	UseRawPhoto     bool
	DisplayPhoto    *DB_Photo
}

func (i *DB_RawPhoto) SetPrivate() *DB_RawPhoto {
	i.PhotoPrivacy = PhotoPrivacy_photo_privacy_private
	return i
}

func (i *DB_RawPhoto) SetPublic() *DB_RawPhoto {
	i.PhotoPrivacy = PhotoPrivacy_photo_privacy_public
	return i
}

type RawPhotoQueryOptions struct {
	MaskInPipeline      bool
	PreloadUser         bool
	PreloadNote         bool
	PreloadDisplayPhoto bool
	PreloadBasePhoto    bool

	NilIfErrRecordNotFound bool
}

type CommentQueryOptions struct {
	PreloadUser    bool
	PreloadReplyTo bool

	NilIfErrRecordNotFound bool
}

func DefaultRawPhotoQueryOptions() *RawPhotoQueryOptions {
	return &RawPhotoQueryOptions{
		MaskInPipeline:         true,
		PreloadUser:            true,
		PreloadNote:            true,
		PreloadDisplayPhoto:    true,
		PreloadBasePhoto:       false,
		NilIfErrRecordNotFound: true,
	}
}

func (p *DB_RawPhoto) UserRawPhotoQueryOptions(qUser *DB_User) *RawPhotoQueryOptions {
	o := DefaultRawPhotoQueryOptions()

	if p.User.EqualToUser(qUser) {
		o.PreloadBasePhoto = true
	}
	return o
}

func (o *RawPhotoQueryOptions) MaskPhotoQuery(DB *gorm.DB, query *gorm.DB) *gorm.DB {
	if o.MaskInPipeline {
		query = query.Where("in_pipeline = ?", false)
	}
	if o.PreloadUser {
		query = query.Preload(`User`)
	}
	if o.PreloadNote {
		query = query.Preload(`Note`)
	}
	if o.PreloadDisplayPhoto {
		query = query.Preload(`DisplayPhoto`)
	}
	if o.PreloadBasePhoto {
		query = query.Preload(`BasePhoto`)
	}
	return query
}

func FirstRawPhotoByMD5(DB *gorm.DB, user *DB_User, Identifier *StringType, o *RawPhotoQueryOptions) (*DB_RawPhoto, error) {
	var image DB_RawPhoto
	if err := o.MaskPhotoQuery(DB, DB.Where(&DB_RawPhoto{UserUUID: user.UUID, Identifier: Identifier})).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &image, nil
}

func FirstRawPhotoByUserIdentifier(DB *gorm.DB, uUUID uuid.UUID, identifier string, o *RawPhotoQueryOptions) (*DB_RawPhoto, error) {
	var image DB_RawPhoto
	if err := o.MaskPhotoQuery(DB, DB.Where(&DB_RawPhoto{UserUUID: uUUID, Identifier: String(identifier)})).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &image, nil
}

func FirstRawPhotoByID(DB *gorm.DB, ID int64, o *RawPhotoQueryOptions) (*DB_RawPhoto, error) {
	var p DB_RawPhoto
	if err := o.MaskPhotoQuery(DB, DB.Where("id = ?", ID)).First(&p).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &p, nil
}

func FirstRawPhotoByUUID(DB *gorm.DB, UUID uuid.UUID, o *RawPhotoQueryOptions) (*DB_RawPhoto, error) {
	var image DB_RawPhoto
	if err := o.MaskPhotoQuery(DB, DB.Where("uuid = ?", UUID.String())).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &image, nil
}

func FirstRawPhotoByUUIDWithDel(DB *gorm.DB, UUID uuid.UUID, o *RawPhotoQueryOptions) (*DB_RawPhoto, error) {
	var image DB_RawPhoto
	if err := o.MaskPhotoQuery(DB, DB.Unscoped().Where("uuid = ?", UUID.String())).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &image, nil
}

func FindRawPhotosByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID, o *RawPhotoQueryOptions) ([]*DB_RawPhoto, error) {
	var is []*DB_RawPhoto
	if err := o.MaskPhotoQuery(DB, DB.Where("uuid in (?)", UUIDs)).Find(&is).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return is, nil
}

func FindRawPhotosByIDs(DB *gorm.DB, IDs []int64, o *RawPhotoQueryOptions) ([]*DB_RawPhoto, error) {
	var is []*DB_RawPhoto
	DB.LogMode(true)
	fmt.Println("***********100")
	if err := o.MaskPhotoQuery(DB, DB.Where("id in (?)", IDs)).Order("id asc").Find(&is).Error; err != nil {
		if err == gorm.ErrRecordNotFound && o.NilIfErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return is, nil
}

func FindRawPhotosByUserID(DB *gorm.DB, UUID uuid.UUID, o *RawPhotoQueryOptions, options *QueryParameter) ([]*DB_RawPhoto, error) {
	query := findPhotosQuery(DB, UUID, options, o)

	var images []*DB_RawPhoto
	if err := query.Find(&images).Error; err != nil {
		return nil, err
	}

	return images, nil
}

func FindPublicRawPhotosByUserID(DB *gorm.DB, UUID uuid.UUID, o *RawPhotoQueryOptions, options *QueryParameter) ([]*DB_RawPhoto, error) {
	query := findPhotosQuery(DB, UUID, options, o)

	var images []*DB_RawPhoto
	if err := query.Where(&DB_RawPhoto{PhotoPrivacy: PhotoPrivacy_photo_privacy_public}).Find(&images).Error; err != nil {
		return nil, err
	}

	return images, nil
}

func findPhotosQuery(DB *gorm.DB, uUUID uuid.UUID, options *QueryParameter, o *RawPhotoQueryOptions) *gorm.DB {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}

	query := DB.Where(&DB_RawPhoto{UserUUID: uUUID})

	if options.MaxID != 0 {
		query = query.Where("id < ?", options.MaxID)

	}
	if options.SinceID != 0 {
		query = query.Where("id > ?", options.SinceID)
	}

	query = o.MaskPhotoQuery(DB, query)

	if options.Page != 0 {
		// Calculate offset
		var offset int32 = options.Page * count
		query = query.Offset(int(offset))
	}

	query = query.Limit(int(count)).Order("id desc")
	return query
}

// LinkNote method, this method will update note on image
func (i *DB_RawPhoto) SetNote(DB *gorm.DB, n *DB_Note) (*DB_Note, error) {
	i.Note = n
	i.NoteUUID = n.UUID
	if _, err := i.Save(DB); err != nil {
		return nil, err
	}
	return n, nil
}

// GetNote method, Get Note
func (i *DB_RawPhoto) GetNote(DB *gorm.DB) *DB_Note {
	if i.Note != nil {
		return i.Note
	}

	var note DB_Note
	DB.Model(&i).Related(&note)

	return &note
}

func (i *DB_RawPhoto) FirstCommentByUser(DB *gorm.DB, user *DB_User) (*DB_Comment, error) {
	var comment DB_Comment

	if err := DB.Where(&DB_Comment{SourceId: i.ID, UserUUID: user.UUID}).Preload("User").Preload("ReplyTo").First(&comment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &comment, nil
}

func (i *DB_RawPhoto) FindOwnerComment(DB *gorm.DB, user *DB_User) ([]*DB_Comment, error) {

	var comments []*DB_Comment
	//		if err := query.Limit(count).Order("id desc").Preload("User").Preload("ReplyTo").Preload("User").Find(&comments).Error; err != nil {
	if err := DB.Where(&DB_Comment{SourceId: i.ID}).Where(&DB_Comment{UserUUID: user.UUID}).Order("id desc").Preload("User").Preload("ReplyTo").Find(&comments).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return []*DB_Comment{}, nil
		}
	}
	return comments, nil
}

func FirstPhotosWithDeleted(RDB *gorm.DB, userUUID uuid.UUID) (*DB_RawPhoto, error) {
	var image DB_RawPhoto
	if err := RDB.Unscoped().Where(&DB_RawPhoto{UserUUID: userUUID}).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &image, nil
}

func PhotoPrivacySwitch(RDB *gorm.DB, p *DB_RawPhoto, privacy PhotoPrivacy) (*DB_RawPhoto, error) {
	var ps []*DB_RawPhoto
	var err error
	switch privacy {
	case PhotoPrivacy_photo_privacy_private:
		ps, err = PrivateHandler(RDB, []*DB_RawPhoto{p})
	case PhotoPrivacy_photo_privacy_public:
		ps, err = PublicHandler(RDB, []*DB_RawPhoto{p})
	default:
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return ps[0], nil
}

func PublicHandler(RDB *gorm.DB, ps []*DB_RawPhoto) ([]*DB_RawPhoto, error) {
	photoUUIDs := make([]uuid.UUID, len(ps))
	for k, v := range ps {
		photoUUIDs[k] = v.UUID
	}

	if err := RDB.Model(&DB_RawPhoto{}).Where("uuid IN (?)", photoUUIDs).
		Updates(DB_RawPhoto{PhotoPrivacy: PhotoPrivacy_photo_privacy_public}).Error; err != nil {
		return nil, err
	}

	return ps, nil
}

func PrivateHandler(RDB *gorm.DB, ps []*DB_RawPhoto) ([]*DB_RawPhoto, error) {
	photoUUIDs := make([]uuid.UUID, len(ps))
	for k, v := range ps {
		photoUUIDs[k] = v.UUID
	}

	if err := RDB.Model(&DB_RawPhoto{}).Where("uuid IN (?)", photoUUIDs).
		Updates(DB_RawPhoto{PhotoPrivacy: PhotoPrivacy_photo_privacy_private}).Error; err != nil {
		return nil, err
	}

	return ps, nil
}