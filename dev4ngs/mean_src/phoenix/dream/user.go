// This file "user.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package dream

import (
	"encoding/json"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	//"log"
	"time"
)

// Gender 类型用于 标示用户的性别, 之所以使用 int 类型来标示
// Gender 是出于对未来程序可扩展性的考虑
type Gender int

const (
	// UserGenderFemale 指示女性
	UserGenderFemale Gender = 1 + iota
	// UserGenderMale 指示男性
	UserGenderMale
)

func (g Gender) ToString() (string, error) {
	switch g {
	case UserGenderFemale:
		return "female", nil
	case UserGenderMale:
		return "male", nil
	}
	return "", (StringConversionFail("gender conversion fail"))
}

func SToGender(s string) (Gender, error) {
	if s == "female" || s == "Female" {
		return UserGenderFemale, nil
	} else if s == "male" || s == "Male" {
		return UserGenderMale, nil
	}

	return 0, StringConversionFail("gender conversion fail")
}

// Status 用于标示用户账户的状态
type Status int

const (
	// UserStatusActivated 标示用户账户为正常开启, 可以使用
	UserStatusActivated Status = 1 + iota
	// UserStatusDeactivated 标示用户账户为禁用状态, 可以在日后被打开
	UserStatusDeactivated
	// UserStatusClosed 标示用户账户被永久停止
	UserStatusClosed
)

// UserSecretType 用户指示用户 UserSecret 的类型
type UserSecretType int

const (
	// UserSecretType 标示用户在更换密码
	UserSecretTypeNewPassword UserSecretType = 1 + iota
	// UserSecretType 标示用户在更换邮箱
	UserSecretTypeNewEmail
	// UserSecretTypeNewMobile 标示用户在更换手机号
	UserSecretTypeNewMobile
)

// UserSecret 是一个储存用户消费型秘密信息的容器. 当用户进行一个需要验证的操作时, 一个 Code 和
// Secret 会保存在相应的 UserSecretType 下, Code 用于用户端校验, 而 Secret 用于
// 下一步操作的校验
type UserSecret struct {
	UserSecretType UserSecretType
	Code           string
	Secret         string
}

type Location struct {
	Country  string `json:"country"`
	State    string `json:"state"`
	City     string `json:"city"`
	District string `json:"district"`
}

// User data model, user data model should contain information
// regarding user's registration detail and personal information
// simple property used by system only can be included. Yet, if,
// in the future, a larger set of property of user needs to be
// defined, a associate table will be appreciated.
type User struct {
	Model

	TusoId      string `sql:"not null;unique" json:"tuso_id,omitempty"`
	Email       string `json:"-"`
	PhoneNumber string `json:"-"`
	Password    string `sql:"not null" json:"-"`
	Salt        string `sql:"not null" json:"-"`

	Nickname string     `sql:"not null" json:"nickname,omitempty"`
	RealName string     `json:"real_name,omitempty"`
	Birthday *time.Time `json:"birthday,omitempty"`
	Location string     `sql:"json" json:"location,omitempty"`
	Gender   *Gender    `json:"gender,omitempty"`

	DeviceToken string `json:"-"`

	// Count property, following properties services as counts for
	// variety purpose. In general, those properties should have
	// default value of 0 and increment or decrement by certain number
	// when
	//
	// Number of user whom this user is following
	Followees NullInt `sql:"default:0" json:"folowees,omitempty"`

	// Number of user who is following this user
	Followers NullInt `sql:"default:0" json:"folowers,omitempty"`

	// Number of user who is friend with this user
	Friends NullInt `sql:"default:0" json:"friends,omitempty"`

	// Number of images this user have
	Images NullInt `sql:"default:0" json:"images,omitempty"`

	// Number of tusos this user send out
	Tusos NullInt `sql:"default:0" json:"tusos,omitempty"`

	Token      string `json:"-"`
	OpenID     string `json:"-"`
	NuclearKey string `json:"-"`

	Secrets string  `sql:"json" json:"-"`
	Status  *Status `sql:"default:1" json:"-"`

	//	Avatar    *Photo  `gorm:"ForeignKey:AvatarID" json:"avatar,omitempty"`
	AvatarID  NullInt `json:"-"`
	AvatarURL string
}

// UserRelatedType 类型标示两个用户之间的用户关系. 注意, 用户关系是有方向的, 也就是说
// 用户关系的方向: 用户 --> 用户
type UserRelatedType int

const (
	// UserRelatedTypeNone 标示两用户间没关系
	UserRelatedTypeNone UserRelatedType = 1 + iota
	// UserRelatedTypeFollowee 标示 用户 --> 用户 的关系为 关注
	UserRelatedTypeFollowee
	// UserRelatedTypeFollower 标示 用户 --> 用户 的关系为 被关注
	UserRelatedTypeFollower
	// UserRelatedTypeMutualFollow 标示 用户 --> 用户 的关系为 相互关注
	UserRelatedTypeMutualFollow
	// UserRelatedTypeFriend 标示 用户 --> 用户 的关系为 好友
	UserRelatedTypeFriend
	// UserRelatedTypeSelf 标示 用户 --> 用户 的关系为 自己
	UserRelatedTypeSelf = 100
)

// ToString 方法, 将 UserRelatedType 转换为 String
func (t UserRelatedType) ToString() string {
	switch t {
	case UserRelatedTypeNone:
		return "related_type_none"
	case UserRelatedTypeFollowee:
		return "related_type_followee"
	case UserRelatedTypeFollower:
		return "related_type_follower"
	case UserRelatedTypeMutualFollow:
		return "related_type_mutual_follow"
	case UserRelatedTypeFriend:
		return "related_type_friend"
	}

	return ""
}

// ToString 方法, 将 Status 转换为 String
func (s Status) ToString() string {
	switch s {
	case UserStatusActivated:
		return "user_status_activated"
	case UserStatusDeactivated:
		return "user_status_deactivated"
	case UserStatusClosed:
		return "user_status_closed"
	}
	return ""
}

// SToUserRelatedType 方法, 将 string 转换为 UserRelatedType
func SToUserRelatedType(s string) UserRelatedType {
	if s == "related_type_none" || s == "UserRelatedTypeNone" {
		return UserRelatedTypeNone
	} else if s == "related_type_followee" || s == "UserRelatedTypeFollowee" {
		return UserRelatedTypeFollowee
	} else if s == "related_type_follower" || s == "UserRelatedTypeFollower" {
		return UserRelatedTypeFollower
	} else if s == "related_type_mutual_follow" || s == "UserRelatedTypeMutualFollow" {
		return UserRelatedTypeMutualFollow
	} else if s == "related_type_friend" || s == "UserRelatedTypeFriend" {
		return UserRelatedTypeFriend
	}
	return 0
}

// UserRelation Struct, 用于储存用户关系
type UserRelation struct {
	Model
	FromID int64
	From   *User `gorm:"ForeignKey:FromID"`

	ToID int64
	To   *User `gorm:"ForeignKey:ForeignKey"`

	RelatedType     UserRelatedType
	ApplyingFriends bool
}

// NewMobileUser 方法, 生成一个新的 User, Username 为 Mobile

func NewMobileUser(DB *gorm.DB, username, password, salt, device string) (*User, error) {
	gender := UserGenderMale
	user := &User{
		PhoneNumber: username,
		Password:    password,
		Token:       RandomString(32),
		TusoId:      RandomNumber(7),
		NuclearKey:  RandomString(32),
		Salt:        salt,
		DeviceToken: device,
		Gender:      &gender,
	}

	if err := DB.Save(&user).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return user, nil
}

// NewEmailUser 方法, 生成一个新的 User, Username 为 Email
func NewEmailUser(DB *gorm.DB, username, password, salt, device string) (*User, error) {
	gender := UserGenderMale
	user := &User{
		Email:       username,
		Password:    password,
		Token:       RandomString(32),
		TusoId:      RandomNumber(7),
		NuclearKey:  RandomString(32),
		Salt:        salt,
		DeviceToken: device,
		Gender:      &gender,
	}

	if err := DB.Save(&user).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return user, nil
}

// NewAnonymousUser 方法, 生成一个新的 匿名 User, Username 为 Email
func NewAnonymousUser(DB *gorm.DB, openID string) (*User, error) {
	user := &User{
		OpenID:     openID,
		Token:      RandomString(32),
		TusoId:     RandomNumber(6),
		NuclearKey: RandomString(32),
	}

	if err := DB.Save(&user).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return user, nil
}

// EqualToUser 方法: 检查传入用户是否和当前用户为同一用户
func (u *User) EqualToUser(tu *User) bool {
	return u.ID == tu.ID
}

// Mark - Begin secret methods
// GetSecrets 方法: 获取 User 的 UserSecrete 数组
func (u *User) GetSecrets() ([]*UserSecret, error) {
	secretString := u.Secrets

	if secretString == "" {
		return []*UserSecret{}, nil
	}
	var secrets = make([]*UserSecret, 0)

	if err := json.Unmarshal([]byte(secretString), &secrets); err != nil {
		return nil, err
	}

	return secrets, nil
}

// UpdateSecret By:jack 目前传入的是一个字符串 并不是原先设计的json方式 如果之后有需要可以进行修改
func (u *User) UpdateSecret(DB *gorm.DB) (*User, error) {
	u.Secrets = RandomNumber(6)
	if err := DB.Save(u).Error; err != nil {
		return u, err
	}
	return u, nil
}
func (u *User) GetSecretByEmail(DB *gorm.DB, userName string) (*User, error) {
	if err := DB.Where("email = ?", userName).Preload("Avatar").First(u).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return u, nil
}

func (u *User) GetSecretByMobile(DB *gorm.DB, userName string) (*User, error) {
	if err := DB.Where("phone_number = ?", userName).Preload("Avatar").First(u).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return u, nil
}

func (u *User) ChangePassBySecret(DB *gorm.DB, pass string) (*User, error) {
	u.Password = pass
	u.Secrets = ""

	if err := DB.Save(u).Error; err != nil {
		return nil, err
	}
	return u, nil
}

// AppendSecret 方法: 添加 UserSecrete 至 User 的 UserSecrete 数组, 如果 UserSecretType 已存在则覆盖
func (u *User) AppendSecret(DB *gorm.DB, s *UserSecret) ([]*UserSecret, error) {
	secrets, err := u.GetSecrets()

	if err != nil {
		return nil, err
	}
	secretExists := false

	for _, secret := range secrets {
		if secret.UserSecretType == s.UserSecretType {
			secret = s
			secretExists = true
		}
	}
	if !secretExists {
		secrets = append(secrets, s)
	}
	secretString, err := json.Marshal(secrets)

	if err != nil {
		return nil, err
	}
	u.Secrets = string(secretString)

	if err := DB.Save(u).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return secrets, nil
}

// DuplicateOmiteEmpty 方法: 克隆当前对象的 ID 与 UUID, 除此之外一律不克隆
func (u *User) DuplicateOmitEmpty() Dungeons {
	c := make(Dungeons)

	c[`id`] = u.ID
	c[`uuid`] = u.UUID
	if u.AvatarURL != "" {
		c[`avatar_url`] = u.AvatarURL
	}

	return c
}

// ToData 方法, 返回 Dungeons 对象
func (u User) ToData(DB *gorm.DB, rUser *User, plenty, nested bool) (Dungeons, error) {
	if !plenty {
		return u.DuplicateOmitEmpty(), nil
	}

	re, err := u.Paramount(DB, rUser, UserRelatedTypeFriend)
	if err != nil {
		return nil, err
	}

	d := make(Dungeons)
	d[`id`] = u.ID
	d[`uuid`] = u.UUID
	if u.Nickname == "" {
		if v := u.Email; v != "" {
			d[`email`] = v
		}
		if v := u.PhoneNumber; v != "" {
			d[`phone_number`] = v
		}
	}
	d[`nickname`] = u.Nickname
	d[`followees`] = u.Followees.Int64
	d[`followers`] = u.Followers.Int64
	if re {
		d[`tuso_id`] = u.TusoId

		if v := u.RealName; v != "" {
			d[`real_name`] = v
		}

		if v := u.Birthday; v != nil {
			d[`birthday`] = v
		}
		if v := u.Gender; v != nil {
			d[`gender`], err = v.ToString()
			if err != nil {
				d[`gender`] = ""
			}
		}

		if v := u.Location; v != "" {
			var l Location
			if err := json.Unmarshal([]byte(v), &l); err != nil {
				return nil, err
			}

			d[`location`] = l
		}

		d[`friends`] = u.Friends.Int64
		d[`images`] = u.Images.Int64
		d[`tusos`] = u.Tusos.Int64
	}

	if u.AvatarURL != "" {
		d[`avatar_url`] = u.AvatarURL
	}

	return d, nil
}

// AdminToData 方法, 返回 Dungeons 对象
func (u *User) AdminToData(DB *gorm.DB, rUser *User, plenty bool) (Dungeons, error) {
	if !plenty {
		return u.DuplicateOmitEmpty(), nil
	}

	d := make(Dungeons)
	d[`id`] = u.ID
	d[`uuid`] = u.UUID
	d[`nickname`] = u.Nickname
	d[`phone`] = u.PhoneNumber
	d[`email`] = u.Email
	d[`create_at`] = u.CreatedAt.Format(time.RFC3339)
	d[`status`] = u.Status
	return d, nil
}

func (u *User) UserInfoToData() Dungeons {
	d := make(Dungeons)
	d[`id`] = u.ID
	d[`uuid`] = u.UUID
	d[`nickname`] = u.Nickname
	d[`phone`] = u.PhoneNumber
	d[`email`] = u.Email
	d[`real_name`] = u.RealName
	if u.Birthday != nil {
		d[`birthday`] = u.Birthday.Format(time.Stamp)
	} else {
		d[`birthday`] = ""
	}
	d[`followees`] = u.Followees
	d[`followers`] = u.Followers
	d[`friends`] = u.Friends
	d[`images`] = u.Images
	d[`tusos`] = u.Tusos
	d[`avatar_url`] = u.AvatarURL
	d[`create_at`] = u.CreatedAt.Format(time.Stamp)
	d[`status`] = u.Status
	return d
}

func (u *User) ToDataWithTokenAndNuclearKey(DB *gorm.DB) (Dungeons, error) {
	d, err := u.ToData(DB, u, true, true)
	if err != nil {
		return nil, err
	}

	d[`token`] = u.Token
	d[`nuclear_key`] = u.NuclearKey

	return d, nil
}

// Increment 方法: 在指定 key 上自增指定 数值
func (u *User) Increment(DB *gorm.DB, key string, a int) error {
	if err := DB.Model(u).UpdateColumn(key, gorm.Expr(key+" + ?", a)).Error; err != nil {
		return NewXFailError(err)
	}
	return nil
}

// IncrementFollowees 方法: 在用户粉丝数上自增指定 数值
func (u *User) IncrementFollowees(DB *gorm.DB, a int) error {
	if err := u.Increment(DB, "followees", a); err != nil {
		return NewXFailError(err)
	}
	// work around to update struct
	// https://github.com/jinzhu/gorm/issues/738
	u.Followees.Int64++
	return nil
}

// IncrementFollowers 方法: 在用户关注数上自增指定 数值
func (u *User) IncrementFollowers(DB *gorm.DB, a int) error {
	if err := u.Increment(DB, "followers", a); err != nil {
		return NewXFailError(err)
	}
	u.Followers.Int64++
	return nil
}

// IncrementFriends 方法: 在用户好友数上自增指定 数值
func (u *User) IncrementFriends(DB *gorm.DB, a int) error {
	if err := u.Increment(DB, "friends", a); err != nil {
		return NewXFailError(err)
	}
	u.Friends.Int64++
	return nil
}

// IncrementImages 方法: 在用户图片数上自增指定 数值
func (u *User) IncrementImages(DB *gorm.DB, a int) error {
	if err := u.Increment(DB, "images", a); err != nil {
		return NewXFailError(err)
	}
	u.Images.Int64++
	return nil
}

// IncrementTusos 方法: 在用户图说数上自增指定 数值
func (u *User) IncrementTusos(DB *gorm.DB, a int) error {
	if err := u.Increment(DB, "tusos", a); err != nil {
		return NewXFailError(err)
	}
	u.Tusos.Int64++
	return nil
}

// FirstUserByEmail 方法: 通过查询 Email 获取用户, 并 preload user
func FirstUserByEmail(DB *gorm.DB, email string) (*User, error) {
	var registeredUser User

	if err := DB.Where("email = ?", email).First(&registeredUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &registeredUser, nil
}

// FirstUserByOpenID 方法: 通过查询 OpenID 获取用户, 并 preload user
func FirstUserByOpenID(DB *gorm.DB, openID string) (*User, error) {
	var u User

	if err := DB.Where("open_id = ?", openID).First(&u).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &u, nil
}

// FirstUserByPhoneNumber 方法: 通过查询 手机号 获取用户, 并 preload user
func FirstUserByPhoneNumber(DB *gorm.DB, PhoneNumber string) (*User, error) {
	var registeredUser User

	if err := DB.Where("phone_number = ?", PhoneNumber).First(&registeredUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &registeredUser, nil
}

// FirstUserByUUID 方法: 通过查询  UUID 获取用户, 并 preload user
func FirstUserByUUID(DB *gorm.DB, UUID uuid.UUID) (*User, error) {
	var user User
	if err := DB.Where("uuid = ?", UUID.String()).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}

// FirstUserByID 方法: 通过查询  UUID 获取用户, 并 preload user
func FirstUserByID(DB *gorm.DB, id NullInt) (*User, error) {
	var user User
	if err := DB.Where("id = ?", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}
func FindUserByUUIDs(DB *gorm.DB, UUIDs []uuid.UUID) ([]*User, error) {
	var us []*User
	if err := DB.Where("uuid in (?)", UUIDs).Find(&us).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return us, nil
}
func FindUsersByNickName(DB *gorm.DB, name string, options *QueryParameter) ([]*User, error) {
	var us []*User
	query := FindUsersByNickNameQuery(DB, options)
	if err := query.Where("nickname LIKE (?)", "%"+name+"%").Find(&us).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return us, nil
}
func FindUsersByNickNameQuery(DB *gorm.DB, options *QueryParameter) *gorm.DB {
	var count = 25
	if options.Count != 0 {
		count = options.Count
	}

	//query := DB.Where(&RawPhoto{UserID: NewValidNullInt(user.ID)})
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
		var offset = options.Page * count
		query.Offset(offset)
	}

	query.Limit(count).Order("id desc")
	return query
}
func adminFindUserQuery(DB *gorm.DB, options *AdminQueryParameter) (*gorm.DB, error) {
	var count = 10
	if options.Count != 0 {
		count = options.Count
	}

	query := DB.Not("status = ?", UserStatusClosed)
	if options.SinceAt != "" {
		sinceAt, err := time.Parse(time.RFC3339, options.SinceAt)
		if err != nil {
			return nil, err
		}
		query = query.Where("create_at > ?", sinceAt)
	}
	if options.MaxAt != "" {
		maxAt, err := time.Parse(time.RFC3339, options.MaxAt)
		if err != nil {
			return nil, err
		}
		query = query.Where("create_at < ?", maxAt)
	}

	var page = 1
	if options.CurrentPage != 0 {
		page = options.CurrentPage
	}

	offset := (page - 1) * count
	query.Offset(offset)

	if options.Sort == "desc" {
		query.Limit(count).Order("id desc")
	} else {
		query.Limit(count)
	}
	return query, nil
}

func AdminFindUser(DB *gorm.DB, options *AdminQueryParameter) ([]*User, error) {
	query, err := adminFindUserQuery(DB, options)
	if err != nil {
		return nil, err
	}

	var users []*User
	if err := query.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// FirstUserByTusoID 方法: 通过查询  图说号 获取用户, 并 preload user
func FirstUserByTusoID(DB *gorm.DB, TusoID string) (*User, error) {
	var user User

	if err := DB.Where("tuso_id = ?", TusoID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}

// FirstUserByToken 方法: 通过查询 Token 获取用户
func FirstUserByToken(DB *gorm.DB, token string) (*User, error) {
	var user User

	if err := DB.Where("token = ?", token).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}

// FirstUserByToken 方法: 通过查询 Token 获取用户
func (u *User) FirstDeviceTokenByUser(DB *gorm.DB, dToken string) (*User, error) {
	var user User

	if err := DB.Where("device_token = ?", dToken).First(u).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &user, nil
}

func (u *User) Paramount(DB *gorm.DB, rUser *User, thresholdRType UserRelatedType) (bool, error) {
	if u.EqualToUser(rUser) {
		return true, nil
	}

	t, err := u.GetRelationType(DB, rUser)
	if err != nil {
		return false, err
	}
	if t >= thresholdRType {
		return true, nil
	}

	return false, nil
}

// GetRelation 方法: 获取当前用户和传入用户的关系对象, 其方向为:
// 		当前用户   -->   传入用户
func (u *User) GetRelation(DB *gorm.DB, rUser *User) (*UserRelation, error) {
	var uRelation UserRelation

	if err := DB.Where(&UserRelation{FromID: u.ID, ToID: rUser.ID}).First(&uRelation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}

	return &uRelation, nil

}

// GetRelation 方法: 获取当前用户和传入用户的关系类型, 其方向为:
// 		当前用户   -->   传入用户
// 如关系对象不存在,则返回 UserRelatedTypeNone
func (u *User) GetRelationType(DB *gorm.DB, rUser *User) (UserRelatedType, error) {
	uRelation, err := u.GetRelation(DB, rUser)
	if err != nil {
		return 0, err
	}

	if uRelation == nil {
		return UserRelatedTypeNone, nil
	}

	return uRelation.RelatedType, nil
}

// UpsertRelation 方法: 生成或更新当前用户和传入用户的关系类型, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *User) UpsertRelation(DB *gorm.DB, rUser *User, rType UserRelatedType) (*UserRelation, error) {
	var relation UserRelation

	if err := DB.Where(&UserRelation{FromID: u.ID, ToID: rUser.ID}).FirstOrInit(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	relation.RelatedType = rType

	if err := DB.Save(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

// RequestFriend 方法: 保存 当前用户 对 传入用户 的好友申请状态, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *User) RequestFriend(DB *gorm.DB, rUser *User) (*UserRelation, error) {
	var requestFriendRelation UserRelation
	if err := DB.Where(&UserRelation{FromID: u.ID, ToID: rUser.ID}).FirstOrInit(&requestFriendRelation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	requestFriendRelation.ApplyingFriends = true

	if err := DB.Save(&requestFriendRelation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &requestFriendRelation, nil
}

// CleanFriendRequest 方法: 清除 当前用户 对 传入用户 的好有申请状态, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *User) CleanFriendRequest(DB *gorm.DB, rUser *User) (*UserRelation, error) {
	var rejectFriendRequest UserRelation
	if err := DB.Where(&UserRelation{FromID: rUser.ID, ToID: u.ID}).FirstOrInit(&rejectFriendRequest).Error; err != nil {
		return nil, NewXFailError(err)
	}
	rejectFriendRequest.ApplyingFriends = false

	if err := DB.Save(&rejectFriendRequest).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &rejectFriendRequest, nil
}

func (u *User) Delete(DB *gorm.DB) error {
	if err := DB.Delete(&u).Error; err != nil {
		return NewXFailError(err)
	}

	now := time.Now()
	u.DeletedAt = &now
	return nil
}

// MakeFriend 方法: 将 当前用户 和 传入用户 相互设为好友关系, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *User) MakeFriend(DB *gorm.DB, rUser *User) (*UserRelation, error) {
	var relation UserRelation

	if err := DB.Where(&UserRelation{FromID: u.ID, ToID: rUser.ID}).FirstOrInit(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	relation.ApplyingFriends = false
	relation.RelatedType = UserRelatedTypeFriend
	if err := DB.Save(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

// TerminateFriendship 方法: 解除 当前用户 和 传入用户 相互之间的好友状态, 其方向为:
// 		当前用户   -->   传入用户
// 注: 本方法会保存关系对象.
func (u *User) TerminateFriendship(DB *gorm.DB, rUser *User) (*UserRelation, error) {
	var relation UserRelation

	if err := DB.Where(&UserRelation{FromID: u.ID, ToID: rUser.ID}).FirstOrInit(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	relation.ApplyingFriends = false
	relation.RelatedType = UserRelatedTypeNone
	if err := DB.Save(&relation).Error; err != nil {
		return nil, NewXFailError(err)
	}

	return &relation, nil
}

func (ur UserRelation) ToData(DB *gorm.DB, cu *User) (Dungeons, error) {
	var tu User
	if err := DB.Model(&ur).Related(&tu, "ToID").Error; err != nil {
		return nil, err
	}

	tuData, err := tu.ToData(DB, cu, true, false)
	if err != nil {
		return nil, err
	}

	d := make(Dungeons)
	d[`id`] = ur.ID
	d[`uuid`] = ur.UUID
	d[`relation_type`] = ur.RelatedType.ToString()
	d[`is_applying_friend`] = ur.ApplyingFriends

	d[`target_user`] = tuData

	return d, nil
}

func UserRelationListToData(DB *gorm.DB, own *User, rList []*UserRelation) ([]Dungeons, error) {
	var list []Dungeons
	for _, v := range rList {
		d := make(Dungeons)
		d[`relation_type`] = v.RelatedType.ToString()
		d["user_id"] = v.ToID
		d["user"], _ = v.To.ToData(DB, v.To, true, true)
		list = append(list, d)
	}
	return list, nil
}

func GetFriends(DB *gorm.DB, cu *User) ([]*UserRelation, error) {
	return GetRelationByType(DB, cu, UserRelatedTypeFriend)
}
func GetFollowee(DB *gorm.DB, cu *User) ([]*UserRelation, error) {
	return GetRelationByType(DB, cu, UserRelatedTypeFollowee)
}
func GetFollows(DB *gorm.DB, cu *User) ([]*UserRelation, error) {
	return GetRelationByType(DB, cu, UserRelatedTypeFollower)
}
func GetRelationByType(DB *gorm.DB, cu *User, relationType ...UserRelatedType) ([]*UserRelation, error) {
	var re []*UserRelation

	if err := DB.Where("from_id=? AND related_type in (?)", cu.ID, relationType).Find(&re).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	var users []*User
	var userIds []int64
	for _, v := range re {
		v.To = &User{}
		v.To.ID = v.ToID
		users = append(users, v.To)
		userIds = append(userIds, v.ToID)
	}
	if err := DB.Where("id in (?)", userIds).Find(&users).Error; err != nil {
		return nil, NewXFailError(err)
	}
	for k, v := range re {
		re[k].From = cu
		for _, vv := range users {
			if vv.ID == v.ToID {
				re[k].To = vv
			}
		}
	}
	return re, nil
}

//   关键字查询
func GetUsersByKeyword(DB *gorm.DB, keyword string) ([]*User, error) {
	var u []*User
	if err := DB.Where("email like ?", "%"+keyword+"%").Or("nickname like ?", "%"+keyword+"%").Or("phone_number like ?", "%"+keyword+"%").Or("real_name like ?", "%"+keyword+"%").Find(&u).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, NewXFailError(err)
	}
	return u, nil
}
