package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
)

type DB_Diary struct {
	Model

	User         *DB_User     `gorm:"ForeignKey:UserUUID"`
	UserUUID     uuid.UUID    `sql:"not null;type:uuid" json:"-"`
	Title        *StringType  `sql:"not null" json:"title"`
	Content      *StringType  `sql:"type:text" json:"body"`
	Style        *StringType  `sql:"not null" json:"style"`
	DiaryPrivacy DiaryPrivacy `sql:"not null;default:1" json:"diary_privacy,omitempty"`
	DiaryStatus  DiaryStatus  `sql:"not null;default:1" json:"diary_status,omitempty"`
	Timestamp    time.Time    `sql:"not null" json:"timestamp"`
}

func (a *DB_Diary) TableName() string {
	return "diaries"
}

// NewDiary 方法: 创建一个新的 Diary
func NewDiary(title, content, style *StringType, timestamp time.Time) *DB_Diary {
	n := &DB_Diary{
		Title:     title,
		Content:   content,
		Style:     style,
		Timestamp: timestamp,
	}

	return n
}

// Update 方法: 更新 Diary 内容. 如更新时间实在 24 小时以外,则报错.
func (d *DB_Diary) Update(DB *gorm.DB, title, content, style *StringType) (*DB_Diary, error) {

	d.Title = title
	d.Content = content
	d.Style = style

	if err := DB.Save(&d).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return d, nil
}

func FirstDiaryByID(DB *gorm.DB, ID int64) (*DB_Diary, error) {
	var d DB_Diary
	if err := DB.Where("id = ?", ID).First(&d).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &d, nil
}

func FirstDiaryByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_Diary, error) {
	var d DB_Diary
	if err := DB.Where("uuid = ?", UUID.String()).First(&d).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &d, nil
}

func FindDiarysByIDs(DB *gorm.DB, ID []int64) ([]*DB_Diary, error) {
	var ds []*DB_Diary
	if err := DB.Where("id IN (?)", ID).Find(&ds).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return ds, nil
}

func FindDiarysByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID) ([]*DB_Diary, error) {
	var ds []*DB_Diary
	if err := DB.Where("uuid IN (?)", UUIDs).Find(&ds).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return ds, nil
}

func FindDiarysByUserUUID(DB *gorm.DB, UUID uuid.UUID, options *QueryParameter) ([]*DB_Diary, error) {

	query := DB.Where(&DB_Diary{UserUUID: UUID})

	if options != nil {
		var count int32 = 25
		if options.Count != 0 {
			count = options.Count
		}
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
	}

	var ds []*DB_Diary
	if err := query.Find(&ds).Error; err != nil {
		return nil, err
	}

	return ds, nil

}
func (d *DB_Diary) Save(DB *gorm.DB) (*DB_Diary, error) {
	if err := DB.Save(&d).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return d, nil
}

func (d *DB_Diary) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&d).Error; err != nil {
		return NewXFailError(err)
	}

	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	now := time.Now()
	d.DeletedAt = &now

	return nil
}
