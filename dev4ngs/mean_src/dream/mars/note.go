// This file "note.go" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
)

// Note data model store note objects.
type DB_Note struct {
	Model

	User      *DB_User    `gorm:"ForeignKey:UserUUID"`
	UserUUID  uuid.UUID   `sql:"not null;type:uuid" json:"-"`
	Title     *StringType `sql:"not null" json:"title"`
	Content   *StringType `sql:"type:text" json:"body"`
	Style     *StringType `sql:"not null" json:"style"`
	Timestamp time.Time   `sql:"not null" json:"timestamp"`
}

func (a *DB_Note) TableName() string {
	return "notes"
}

// NewNote 方法: 创建一个新的 Note
func NewNote(title, content, style *StringType, timestamp time.Time) *DB_Note {
	n := &DB_Note{
		Title:     title,
		Content:   content,
		Style:     style,
		Timestamp: timestamp,
	}

	return n
}

// FirstPhoto 方法: 通过 Note 反查 Photo
func (n *DB_Note) FirstPhoto(DB *gorm.DB) (*DB_RawPhoto, error) {
	var image DB_RawPhoto
	if err := DB.Where(&DB_RawPhoto{NoteUUID: n.UUID}).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &image, nil
}

// Update 方法: 更新 Note 内容. 如更新时间实在 24 小时以外,则报错.
func (n *DB_Note) Update(DB *gorm.DB, title, content, style *StringType) (*DB_Note, error) {

	n.Title = title
	n.Content = content
	n.Style = style

	if err := DB.Save(&n).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return n, nil
}

func FirstNoteByID(DB *gorm.DB, ID int64) (*DB_Note, error) {
	var note DB_Note
	if err := DB.Where("id = ?", ID).First(&note).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &note, nil
}

func FirstNoteByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_Note, error) {
	var note DB_Note
	if err := DB.Where("uuid = ?", UUID.String()).First(&note).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &note, nil
}

func FindNotesByIDs(DB *gorm.DB, ID []int64) ([]*DB_Note, error) {
	var notes []*DB_Note
	if err := DB.Where("id IN (?)", ID).First(&notes).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return notes, nil
}

func FindNotesByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID) ([]*DB_Note, error) {
	var notes []*DB_Note
	if err := DB.Where("uuid IN (?)", UUIDs).First(&notes).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return notes, nil
}

func FindNotesByUserUUID(DB *gorm.DB, UUID uuid.UUID, options *QueryParameter) ([]*DB_Note, error) {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}

	query := DB.Where(&DB_Note{UserUUID: UUID})

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

	var notes []*DB_Note
	if err := query.Find(&notes).Error; err != nil {
		return nil, err
	}

	return notes, nil

}

func (n *DB_Note) Save(DB *gorm.DB) (*DB_Note, error) {
	if err := DB.Save(&n).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return n, nil
}

func (n *DB_Note) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&n).Error; err != nil {
		return NewXFailError(err)
	}

	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	now := time.Now()
	n.DeletedAt = &now

	return nil
}
