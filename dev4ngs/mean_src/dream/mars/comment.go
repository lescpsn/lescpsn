// This file "comment" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
)

// Comment data model. A comment instance record a commentary entered by
// user to an internal object, such us tuso, image. A "Type" key is used
// to show the source or root of commentary, in another words, the object
// user commented on. "SourceID" is the primary key of object.
type DB_Comment struct {
	Model

	SourceId    int64       `sql:"not null" json:"-"`
	User        *DB_User    `gorm:"ForeignKey:UserUUID"`
	UserUUID    uuid.UUID   `sql:"not null;type:uuid" json:"-"`
	ReplyTo     *DB_Comment `gorm:"ForeignKey:ReplyToUUID"`
	ReplyToUUID uuid.UUID   `json:"-"`
	Type        CommentType `sql:"not null" json:"type"`
	Content     string      `sql:"type:text not null" json:"content"`
	Timestamp   time.Time   `sql:"not null" json:"timestamp"`
}

func (a *DB_Comment) TableName() string {
	return "comments"
}

// Save 方法: 保存 Comment
func (c *DB_Comment) Save(DB *gorm.DB) (*DB_Comment, error) {
	if err := DB.Save(&c).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return c, nil
}

//TODO 合并写在NewComment中是否可行
// SetReplyTo, set replied to comment and save the result
func (c *DB_Comment) setReplyToAndSave(DB *gorm.DB, r *DB_Comment) (*DB_Comment, error) {
	c.ReplyTo = r
	c.ReplyToUUID = r.UUID

	if err := DB.Save(&c).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return c, nil
}

func FirstCommentByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_Comment, error) {
	var comment DB_Comment
	if err := DB.Where("uuid = ?", UUID.String()).Preload("User").First(&comment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &comment, nil
}

func FirstCommentByID(DB *gorm.DB, ID int64) (*DB_Comment, error) {
	var comment DB_Comment
	if err := DB.Where("id = ?", ID).Preload("User").First(&comment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &comment, nil
}

func FirstCommentByUser(DB *gorm.DB, UUID uuid.UUID, sourceID int64) (*DB_Comment, error) {
	var comment DB_Comment

	if err := DB.Where("uuid = ? and source_id = ?", UUID, sourceID).Preload("User").Preload("ReplyTo").First(&comment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &comment, nil
}

func FirstRepliedComment(DB *gorm.DB, rUUID uuid.UUID, sourceID int64) (*DB_Comment, error) {
	var comment DB_Comment

	if err := DB.Where(&DB_Comment{SourceId: sourceID, ReplyToUUID: rUUID}).First(&comment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
	}

	return &comment, nil
}

func FindPhotoComment(DB *gorm.DB, photoID int64, userUUID uuid.UUID, options *QueryParameter) ([]*DB_Comment, error) {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}

	query := DB.Where(&DB_Comment{SourceId: photoID})

	if options.MaxID != 0 || options.SinceID != 0 {
		if options.MaxID != 0 {
			query = query.Where("id < ?", options.MaxID)
		}
		if options.SinceID != 0 {
			query = query.Where("id > ?", options.SinceID)
		}
	}

	if options.Page != 0 {
		// Calculate offset
		var offset int32 = options.Page * count
		query.Offset(int(offset))
	}

	var comments []*DB_Comment
	if err := query.Not("user_uuid = ?", userUUID).Limit(int(count)).Order("id desc").Preload("User").Preload("Comment").Find(&comments).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return []*DB_Comment{}, nil
		}
	}
	return comments, nil
}

func FindPhotoReply(DB *gorm.DB, photoID int64, replyTo []uuid.UUID) ([]*DB_Comment, error) {

	query := DB.Where(&DB_Comment{SourceId: photoID})

	var comments []*DB_Comment
	if err := query.Where("reply_to_uuid in (?)", replyTo).Order("id desc").Preload("User").Find(&comments).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return []*DB_Comment{}, nil
		}
	}
	return comments, nil
}

func FindNewsComment(DB *gorm.DB, newsID int64, options *QueryParameter) ([]*DB_Comment, error) {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}

	query := DB.Where(&DB_Comment{SourceId: newsID})

	if options.MaxID != 0 || options.SinceID != 0 {
		if options.MaxID != 0 {
			query = query.Where("id < ?", options.MaxID)
		}
		if options.SinceID != 0 {
			query = query.Where("id > ?", options.SinceID)
		}
	}

	if options.Page != 0 {
		// Calculate offset
		var offset int32 = options.Page * count
		query.Offset(int(offset))
	}

	var comments []*DB_Comment
	if err := query.Limit(int(count)).Order("id desc").Preload("User").Preload("ReplyTo").Find(&comments).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return []*DB_Comment{}, nil
		}
	}
	return comments, nil
}

//func (t *DB_News) FirstNewsCommentByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_Comment, error) {
//	var comment DB_Comment
//
//	if err := DB.Where("uuid = ? and source_id = ?", UUID, t.ID).Preload("User").Preload("ReplyTo").First(&comment).Error; err != nil {
//		if err == gorm.ErrRecordNotFound {
//			return nil, nil
//		}
//		return nil, NewXFailError(err)
//	}
//
//	return &comment, nil
//}

// Delete 方法: 删除当前对象, 软删除.
func (c *DB_Comment) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&c).Error; err != nil {
		return NewXFailError(err)
	}

	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	now := time.Now()
	c.DeletedAt = &now

	return nil
}

//// IncrementCommentCount 图说评论自增方法
//func (t *DB_News) IncrementCommentCount(DB *gorm.DB, a int) error {
//	if err := t.Increment(DB, "comment_count", a); err != nil {
//		return NewXFailError(err)
//	}
//	// work around to update struct
//	// https://github.com/jinzhu/gorm/issues/738
//	t.CommentCount.Int += 1
//	return nil
//}

// Delete 方法: 删除当前对象, 软删除.
func DeleteCommentByID(DB *gorm.DB, ID int64) error {
	if err := DB.Where("id = ?", ID).Delete(&DB_Comment{}).Error; err != nil {
		return NewXFailError(err)
	}

	return nil
}
