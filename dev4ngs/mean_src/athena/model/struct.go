// This file "struct" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"gopkg.in/mgo.v2/bson"
)

//
//type PhotoType int
//
//const (
//	PhotoTypeSystem PhotoType = 1 + iota
//	PhotoTypeEdited
//)
//
//type PhotoPrivacy int
//
//const (
//	PhotoPrivacyPublic PhotoPrivacy = 1 + iota
//	PhotoPrivacyPrivate
//)
//
//type PersistentType int
//
//const (
//	PersistentTypeNewPhoto PersistentType = 1 + iota
//	PersistentTypeNewEditedPhoto
//	PersistentTypeEditedPhoto
//	PersistentTypeEditedAvatar
//)
//
//type NewsStarType int
//
//const (
//	NewsStarTypeDeactivated NewsStarType = 1 + iota
//	NewsStarTypeActivated
//)
//
//type CommentType int
//
//const (
//	KCommentTypeNews CommentType = 1 + iota
//	KCommentTypeImage
//	KCommentTypeDiary
//)
//
//type UserRelatedType int64
//
//const (
//	UserRelatedTypeNone UserRelatedType = 1 + iota
//	UserRelatedTypeFollowee
//	UserRelatedTypeFollower
//	UserRelatedTypeMutualFollow
//	UserRelatedTypeFriend
//	UserRelatedTypeSelf = 100
//)
//
//type Gender int
//
//const (
//	UserGenderFemale Gender = 1 + iota
//	UserGenderMale
//)
//
//type Status int
//
//const (
//	UserStatusActivated Status = 1 + iota
//	UserStatusDeactivated
//	UserStatusClosed
//)
//
type Location struct {
	Country  string `json:"country"`
	State    string `json:"state"`
	City     string `json:"city"`
	District string `json:"district"`
}

//
////分页数据
//type PageModel struct {
//	PageSize   int
//	TotalCount int64
//	PageIndex  int
//	Data       interface{}
//}
//
//type QueryParameter struct {
//	SinceID int
//	MaxID   int
//	Page    int
//	Count   int
//}
//
//type PhotoEchoOption struct {
//	FetchBasePhoto bool
//	FetchNote      bool
//	FetchUser      bool
//}
//
//type User struct {
//	ID             int64
//	UUID           string
//	TusoID         NullString
//	Email          NullString
//	MobileNumber   NullString
//	Password       NullString
//	Salt           NullString
//	Token          NullString
//	DeviceToken    NullString
//	Nickname       NullString
//	RealName       NullString
//	Gender         Gender
//	Birthday       NullString
//	Location       NullString
//	FolloweesCount NullInt
//	FollowersCount NullInt
//	FriendsCount   NullInt
//	ImagesCount    NullInt
//	TusosCount     NullInt
//	NuclearKey     NullString
//	Secrets        NullString
//	AvatarURL      NullString
//}
//
//type UserRelation struct {
//	ID              int64
//	UUID            string
//	FromID          NullInt
//	ToID            NullInt
//	RelatedType     UserRelatedType
//	ApplyingFriends NullBool
//}
//
//type Photo struct {
//	ID             int64
//	UUID           string
//	CreatedAt      string
//	User           *User
//	UserUUID       string
//	RawPhoto       *BasePhoto
//	Width          NullInt
//	Height         NullInt
//	InPipeline     NullBool
//	PhotoType      PhotoType
//	FileUUID       string
//	FileSize       NullInt
//	FileURL        NullString
//	Identifier     NullString
//	PhotoPrivacy   PhotoPrivacy
//	PrimaryColor   NullString
//	GEOLocation    NullString
//	Exif           NullString
//	Note           *Note
//	NoteUUID       string
//	URL            NullString
//	DisplayVersion NullInt
//	EditParam      NullString
//	IsAvatar       NullBool
//	IsTuso         NullBool
//	CommentsCount  int
//	Timestamp      string
//}
//
//type BasePhoto struct {
//	ID           int64
//	UUID         string
//	Width        NullInt
//	Height       NullInt
//	FileURL      NullString
//	FileUUID     string
//	FileSize     NullInt
//	PrimaryColor NullString
//}
//
//type Note struct {
//	ID        int64
//	UUID      string
//	CreatedAt string
//	UserUUID  string
//	Title     NullString
//	Content   NullString
//	Style     NullString
//	Timestamp string
//}
//
//type File struct {
//	ID             int64
//	UUID           string
//	CreatedAt      string
//	UserUUID       string
//	Bucket         NullString
//	Key            NullString
//	Size           NullInt
//	PersistentID   NullString
//	PersistentType PersistentType
//}
//
//type News struct {
//	ID           int64
//	UUID         string
//	UserID       NullInt
//	User         *User
//	Photo        []*Photo
//	PhotoCount   NullInt
//	CommentCount NullInt
//	StarredCount NullInt
//	Timestamp    NullString
//}
//
//type NewsStar struct {
//	ID           int64
//	User         *User
//	UserID       NullInt
//	News         *News
//	NewsID       NullInt
//	NewsStarType NewsStarType
//}
//
//type Comment struct {
//	ID          int64
//	UUID        string
//	SourceId    int64
//	User        *User
//	UserUUID    string
//	ReplyTo     *ReplyTo
//	ReplyToUUID string
//	Content     string
//	Type        CommentType
//	Timestamp   string
//}
//
//type ReplyTo struct {
//	ID        int64
//	UUID      string
//	User      *User
//	UserUUID  string
//	Content   string
//	Timestamp string
//}
//
//type Diary struct {
//	ID           int64
//	UUID         string
//	CreatedAt    string       `json:"created_at"`
//	UserUUID     string       `json:"user_uuid"`
//	DiaryPrivacy DiaryPrivacy `json:"diary_privacy"`
//	DiaryStatus  DiaryStatus  `json:"diary_status"`
//	Title        NullString
//	Content      NullString
//	Style        NullString
//	Timestamp    string
//}
//
//type DiaryPrivacy int
//
//const (
//	DiaryPrivacyPublic DiaryPrivacy = 1 + iota
//	DiaryPrivacyPrivate
//)
//
//type DiaryStatus int
//
//const (
//	DiaryStatusEmpty DiaryStatus = 1 + iota
//	DiaryStatusSaved
//	DiaryStatusPublished
//)
//
//type Feedback struct {
//	ID          int64
//	UUID        string
//	Suggest     string
//	CreatedAt   string
//	User        *User
//	UserUUID    string
//	ConnectInfo string
//	From        int
//}

type AccountDynamics struct {
	ID           bson.ObjectId  `json:"id,omitempty" bson:"_id,omitempty"`
	UserUUID     string         `json:"user_uuid" bson:"user_uuid"`
	UserRelation Dungeons       `json:"user_rel" bson:"user_rel"`
	DymsStatus   DynamicsStatus `json:"dyms_status" bson:"dyms_status"`
	Title        string         `json:"title,omitempty" bson:"title,omitempty"`
	Type         string         `json:"type,omitempty" bson:"type,omitempty"`
	Mark         string         `json:"mark,omitempty" bson:"mark,omitempty"`
	Timestamp    string         `bson:"timestamp,omitempty"`
}

type Activity struct {
	ID        bson.ObjectId `json:"id,omitempty" bson:"_id,omitempty"`
	ImgURL    string        `json:"img_url" bson:"img_url"`
	ToURL     string        `json:"to_url" bson:"to_url"`
	Title     string        `json:"title,omitempty" bson:"title,omitempty"`
	Mark      string        `json:"mark,omitempty" bson:"mark,omitempty"`
	Timestamp string        `bson:"timestamp,omitempty"`
}

type DynamicsStatus int

const (
	DynamicsStatusRead DynamicsStatus = 1 + iota
	DynamicsStatusUnread
)
