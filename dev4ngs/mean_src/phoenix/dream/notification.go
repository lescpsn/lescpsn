package dream

import (
	"github.com/jinzhu/gorm"
	//"strings"
)

type Notification struct {
	Model
	Title     string `json:"title"`
	Content   string `json:"content"`
	Mark      string `json:"mark"`
	ErrorType int8   `json:"error_type"`
	UserId    int64  `json:"user_id"`
	Admin     *Admin `gorm:"ForeignKey:UserId" json:"admin"`
}

func SendMsg(db *gorm.DB, msg *Notification) (*Notification, error) {

	obj := msg
	if err := db.Save(msg).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return obj, nil
}

func GetMsgList(db *gorm.DB) ([]*Notification, error) {
	var msgs []*Notification
	if err := db.Where(&Notification{}).Find(&msgs).Error; err != nil {
		return nil, err
	}
	return msgs, nil
}
