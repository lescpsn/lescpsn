// This file "user.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"time"
)

type Location struct {
	Country  StringType `json:"country"`
	State    StringType `json:"state"`
	City     StringType `json:"city"`
	District StringType `json:"district"`
}

// User data model, user data model should contain information
// regarding user's registration detail and personal information
// simple property used by system only can be included. Yet, if,
// in the future, a larger set of property of user needs to be
// defined, a associate table will be appreciated.
type DB_User struct {
	Model

	TusoId      *StringType `sql:"not null;unique" json:"tuso_id,omitempty"`
	Email       *StringType ``
	PhoneNumber *StringType ``
	Password    *StringType `sql:"not null" `
	Salt        *StringType `sql:"not null" `
	Nickname    *StringType `sql:"not null" json:"nickname,omitempty"`
	RealName    *StringType `json:"real_name,omitempty"`
	Birthday    time.Time   `json:"birthday,omitempty"`
	Location    *StringType `sql:"json" json:"location,omitempty"`
	Gender      Gender      `json:"gender,omitempty"`

	// Count property, following properties services as counts for
	// variety purpose. In general, those properties should have
	// default value of 0 and increment or decrement by certain number
	// when
	//
	// Number of user whom this user is following
	Followees *IntegerType `sql:"default:0" json:"folowees,omitempty"`

	// Number of user who is following this user
	Followers *IntegerType `sql:"default:0" json:"folowers,omitempty"`

	// Number of user who is friend with this user
	Friends *IntegerType `sql:"default:0" json:"friends,omitempty"`

	// Number of images this user have
	Images *IntegerType `sql:"default:0" json:"images,omitempty"`

	// Number of tusos this user send out
	Tusos *IntegerType `sql:"default:0" json:"tusos,omitempty"`

	Token      *StringType ``
	NuclearKey *StringType ``
	Secrets    *StringType `sql:"json" `
	Status     Status      `sql:"default:1" `
	FirstPhoto time.Time   `json:"first_photo,omitempty"`
	FirstTuso  time.Time   `json:"first_tuso,omitempty"`
}

func (a *DB_User) TableName() string {
	return "users"
}

// NewMobileUser 方法, 生成一个新的 User, Username 为 Mobile
func NewMobileUser(DB *gorm.DB, username, password, salt string, status Status) (*DB_User, error) {
	//tusoId := String(RandomNumber(6))
	//
	//u, err := FirstUserByTusoID(DB, tusoId)
	//if err != nil {
	//	return nil, NewXFailError(err)
	//}
	//if u != nil {
	//
	//}
	user := &DB_User{
		Model: Model{
			UUID: uuid.NewV4(),
		},
		Nickname:    String(username),
		PhoneNumber: String(username),
		Password:    String(password),
		Token:       String(RandomString(32)),
		TusoId:      String(RandomNumber(6)),
		NuclearKey:  String(RandomString(32)),
		Salt:        String(salt),
		Status:      status,
		Gender:      Gender_user_gender_male,
	}

	if err := DB.Save(&user).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return user, nil
}

// NewEmailUser 方法, 生成一个新的 User, Username 为 Email
func NewEmailUser(DB *gorm.DB, username, password, salt string, status Status) (*DB_User, error) {
	user := DB_User{
		Model: Model{
			UUID: uuid.NewV4(),
		},
		Nickname:   String(username),
		Email:      String(username),
		Password:   String(password),
		Token:      String(RandomString(32)),
		TusoId:     String(RandomNumber(6)),
		NuclearKey: String(RandomString(32)),
		Salt:       String(salt),
		Status:     status,
		Gender:     Gender_user_gender_male,
	}

	if err := DB.Save(&user).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &user, nil
}

// NewAnonymousUser 方法, 生成一个新的 匿名 User, Username 为 Email
func NewAnonymousUser(DB *gorm.DB) (*DB_User, error) {
	user := &DB_User{
		Nickname:   String(""),
		Password:   String(""),
		Token:      String(RandomString(32)),
		TusoId:     String(RandomNumber(6)),
		NuclearKey: String(RandomString(32)),
		Salt:       String(""),
	}

	if err := DB.Save(&user).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return user, nil
}

// Save 方法, 保存 User
func (u *DB_User) Save(DB *gorm.DB) (*DB_User, error) {
	uClone := *u

	if err := DB.Save(&uClone).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return u, nil
}

// EqualToUser 方法: 检查传入用户是否和当前用户为同一用户
func (u *DB_User) EqualToUser(tu *DB_User) bool {
	return u.ID == tu.ID
}

// Increment 方法: 在指定 key 上自增指定 数值
func (u *DB_User) Increment(DB *gorm.DB, key string, a int32) error {
	if err := DB.Model(u).UpdateColumn(key, gorm.Expr(key+" + ?", a)).Error; err != nil {
		return NewXFailError(err)
	}
	return nil
}

// IncrementFollowees 方法: 在用户粉丝数上自增指定 数值
func (u *DB_User) IncrementFollowees(DB *gorm.DB, a int32) error {
	if err := u.Increment(DB, "followees", a); err != nil {
		return NewXFailError(err)
	}
	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	u.Followees.Int++
	return nil
}

// IncrementFollowers 方法: 在用户关注数上自增指定 数值
func (u *DB_User) IncrementFollowers(DB *gorm.DB, a int32) error {
	if err := u.Increment(DB, "followers", a); err != nil {
		return NewXFailError(err)
	}
	u.Followers.Int++
	return nil
}

// IncrementFriends 方法: 在用户好友数上自增指定 数值
func (u *DB_User) IncrementFriends(DB *gorm.DB, a int32) error {
	if err := u.Increment(DB, "friends", a); err != nil {
		return NewXFailError(err)
	}
	u.Friends.Int++
	return nil
}

// IncrementImages 方法: 在用户图片数上自增指定 数值
func (u *DB_User) IncrementImages(DB *gorm.DB, a int32) error {
	if err := u.Increment(DB, "images", a); err != nil {
		return NewXFailError(err)
	}
	u.Images.Int++
	return nil
}

// IncrementTusos 方法: 在用户图说数上自增指定 数值
func (u *DB_User) IncrementTusos(DB *gorm.DB, a int32) error {
	if err := u.Increment(DB, "tusos", a); err != nil {
		return NewXFailError(err)
	}
	u.Tusos.Int++
	return nil
}

// FirstUserByEmail 方法: 通过查询 Email 获取用户, 并 preload user
func FirstUserByEmail(DB *gorm.DB, email string) (*DB_User, error) {
	var registeredUser DB_User

	if err := DB.Where("email = ?", email).First(&registeredUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &registeredUser, nil
}

// FirstUserByPhoneNumber 方法: 通过查询 手机号 获取用户, 并 preload user
func FirstUserByPhoneNumber(DB *gorm.DB, PhoneNumber string) (*DB_User, error) {
	var registeredUser DB_User

	if err := DB.Where("phone_number = ?", PhoneNumber).First(&registeredUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &registeredUser, nil
}

// FirstUserByUUID 方法: 通过查询  UUID 获取用户, 并 preload user
func FirstUserByUUID(DB *gorm.DB, UUID uuid.UUID) (*DB_User, error) {
	var user DB_User
	if err := DB.Where("uuid = ?", UUID.String()).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}

// FirstUserByID 方法: 通过查询  UUID 获取用户, 并 preload user
func FirstUserByID(DB *gorm.DB, id int64) (*DB_User, error) {
	var user DB_User
	if err := DB.Where("id = ?", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}
func FindUserByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID) ([]*DB_User, error) {
	var us []*DB_User
	if err := DB.Where("uuid in (?)", UUIDs).Find(&us).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return us, nil
}

func FindUserByIDs(DB *gorm.DB, IDs []int64) ([]*DB_User, error) {
	var us []*DB_User
	if err := DB.Where("id in (?)", IDs).Find(&us).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return us, nil
}

func FindUserByPhoneNumbers(DB *gorm.DB, PhoneNumbers []string) ([]*DB_User, error) {
	var us []*DB_User

	if err := DB.Where("phone_number in (?)", PhoneNumbers).Find(&us).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return us, nil
}

func FirstUserByTusoID(DB *gorm.DB, TusoID string) (*DB_User, error) {
	var user DB_User

	if err := DB.Where("tuso_id = ?", TusoID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}

func BuildQuery(DB *gorm.DB, options *QueryParameter) *gorm.DB {
	var count int32 = 25
	if options.Count != 0 {
		count = options.Count
	}

	//query := DB.Where(&RawPhoto{UserID: Integer(user.ID)})
	query := DB
	if options.MaxID != 0 {
		query = query.Where("id < ?", options.MaxID)
	}
	if options.SinceID != 0 {
		query = query.Where("id > ?", options.SinceID)
	}

	//query = o.MaskPhotoQuery(DB, query)

	if options.Page != 0 {
		// Calculate offset
		var offset int32 = options.Page * count
		query.Offset(int(offset))
	}

	query.Limit(int(count)).Order("id desc")
	return query
}

// UUIDs: nil 查出所有的马甲用户
// UUIDs: not nil 查出指定UUIDs数组的马甲用户，注意UUIDs是数组，但是可以只有一个元素
func FindSockpuppetUser(DB *gorm.DB, UUIDs []string) ([]*DB_User, error) {
	var us []*DB_User

	if UUIDs == nil { // UUIDs=nil查出status=Status_user_status_sockpuppet(2)的所有马甲用户
		if err := DB.Where("status = ?", Status_user_status_sockpuppet).Find(&us).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, nil
			}
			return nil, NewXFailError(err)
		}
	} else { // UUIDs!=nil查出指定UUIDs数组指定的马甲用户
		if err := DB.Where("uuid in (?)", UUIDs).Find(&us).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, nil
			}
			return nil, NewXFailError(err)
		}
	}
	return us, nil
}

const (
	DESC_SEQ_FOLLOWEES = iota + 1
	DESC_SEQ_FOLLOWERS
	DESC_SEQ_FRIENDS
	ASC_SEQ_FOLLOWEES
	ASC_SEQ_FOLLOWERS
	ASC_SEQ_FRIENDS
)
func AllUserAllRelationGet(DB *gorm.DB, req *AllUserAllRelationRequest) (int64, []*DB_User, error) {
	var us []*DB_User
	offsetHead := req.OffsetHead
	OffsetTail := req.OffsetTail
	SeqenceMethod := req.SeqenceMethod

	var SeqenceCondition  string
	switch SeqenceMethod {
	case DESC_SEQ_FOLLOWEES:
		SeqenceCondition = "followees desc"
	case DESC_SEQ_FOLLOWERS:
		SeqenceCondition = "followers desc"
	case DESC_SEQ_FRIENDS:
		SeqenceCondition = "friends desc"
	case ASC_SEQ_FOLLOWEES:
		SeqenceCondition = "followees asc"
	case ASC_SEQ_FOLLOWERS:
		SeqenceCondition = "followers asc"
	case ASC_SEQ_FRIENDS:
		SeqenceCondition = "friends asc"
	}
	query := DB
	if len(SeqenceCondition) != 0 {
		query = query.Limit(int(OffsetTail-offsetHead)).Order(SeqenceCondition)
	}else{
		query = query.Limit(int(OffsetTail-offsetHead))
	}
	var totalNum int64
	query.Find(&us).Count(&totalNum)
	query.Find(&us)
	return totalNum, us, nil

}
