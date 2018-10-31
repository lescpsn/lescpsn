package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
)

// Feedback from & connectinfo 为预留信息不需要填写，但是为了方便拓展使用
type DB_Feedback struct {
	Model
	Suggest     string `sql:"not null"`
	Type        int32
	ConnectInfo string    ``
	From        int32     ``
	User        *DB_User  `gorm:"ForeignKey:UserUUID"`
	UserUUID    uuid.UUID `sql:"not null;type:uuid" json:"-"`
}

func (a *DB_Feedback) TableName() string {
	return "feedbacks"
}

func FirstFeedbackByID(DB *gorm.DB, ID int64) (*DB_Feedback, error) {
	var feedback DB_Feedback
	if err := DB.Where("id = ?", ID).Preload("User").First(&feedback).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return &feedback, nil
}

func GetFeedbacksList(DB *gorm.DB, options *QueryParameter) (fbs []*DB_Feedback, err error) {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}
	query := DB
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
		query = query.Offset(int(offset))
	}
	if err := query.Limit(int(count)).Order("id desc").Preload("User").Find(&fbs).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}

	}
	return fbs, nil
}
func (fb *DB_Feedback) removeExternalStructField() *DB_Feedback {
	if fb.User != nil {
		fb.UserUUID = fb.User.UUID
		fb.User = nil
	}
	return fb
}

func (fb *DB_Feedback) copyExternalStructField(fbc *DB_Feedback) *DB_Feedback {
	if fbc.User != nil {
		fb.User = fbc.User
	}
	return fb
}

// Save 方法: 保存 Comment
func (f *DB_Feedback) Save(DB *gorm.DB) (*DB_Feedback, error) {
	if err := DB.Save(&f).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return f, nil
}
