package model

import (
	"encoding/json"
	"errors"
	echo "git.ngs.tech/mean/proto"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"time"
)

const MdbNoticeName = "notice"

const (
	MESSAGE_TYPE_RELATION_APPLIED     = "MESSAGE_TYPE_RELATION_APPLIED"     //申请
	MESSAGE_TYPE_RELATION_WAS_APPLIED = "MESSAGE_TYPE_RELATION_WAS_APPLIED" //被申请
	MESSAGE_TYPE_RELATION_REFUSE      = "MESSAGE_TYPE_RELATION_REFUSE"      //拒绝
	MESSAGE_TYPE_RELATION_WAS_REFUSED = "MESSAGE_TYPE_RELATION_WAS_REFUSED" //被拒绝
	MESSAGE_TYPE_RELATION_AGREED      = "MESSAGE_TYPE_RELATION_AGREED"      //同意
	MESSAGE_TYPE_RELATION_WAS_AGREED  = "MESSAGE_TYPE_RELATION_WAS_AGREED"  //被同意
	MESSAGE_TYPE_RELATION_FOLLOW      = "MESSAGE_TYPE_RELATION_FOLLOW"      //关注
	MESSAGE_TYPE_RELATION_WAS_FOLLOW  = "MESSAGE_TYPE_RELATION_WAS_FOLLOW"  //被关注

	MESSAGE_TYPE_COMMENT_IMAGES = "MESSAGE_TYPE_COMMENT_IMAGES" //图片留言
	MESSAGE_TYPE_COMMENT_NEWS   = "MESSAGE_TYPE_COMMENT_NEWS"   //图说评论

	MESSAGE_TYPE_STARRED_NEWS = "MESSAGE_TYPE_STARRED_NEWS" //图说点赞
	MESSAGE_TYPE_SYSTEM       = "MESSAGE_TYPE_SYSTEM"       //系统消息
)

type Notice struct {
	ID        bson.ObjectId    `bson:"_id"`
	FromID    int64            `bson:"from_id"`
	FromUser  *echo.User       `bson:"-"`
	ToID      int64            `bson:"to_id"`
	ToUser    *echo.User       `bson:"-"`
	Title     string           `bson:"title"`
	Type      string           `bson:"type"`
	Content   string           `bson:"content"`
	Timestamp time.Time        `bson:"timestamp"`
	Status    echo.NoticStatus `bson:"status"`
}

func NewNotice(MDB *mgo.Database, nn *Notice) error {
	nn.ID = bson.NewObjectId()
	//如果时间为空的话使用自己的创建
	t := time.Time{}
	if nn.Timestamp == t {
		nn.Timestamp = time.Now()
	}
	nn.Status = echo.NoticStatus_Unread
	err := MDB.C(MdbNoticeName).Insert(nn)
	return err
}

func GetNoticeByType(MDB *mgo.Database, gn *Notice, t string) (*Notice, error) {
	var notice Notice
	if err := GetNoticeCollection(MDB).Find(bson.M{"from_id": gn.FromID, "to_id": gn.ToID, "type": t}).Sort("-timestamp").One(&notice); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &notice, nil
}

func GetNoticeByID(MDB *mgo.Database, gn *Notice) (*Notice, error) {
	var notice Notice
	if err := GetNoticeCollection(MDB).Find(bson.M{"from_id": gn.FromID, "to_id": gn.ToID, "_id": gn.ID}).Sort("-timestamp").One(&notice); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &notice, nil
}

func GetUnReadNotice(MDB *mgo.Database, gn *Notice) (*Notice, error) {
	var notice Notice
	if err := GetNoticeCollection(MDB).Find(bson.M{"from_id": gn.FromID, "to_id": gn.ToID, "type": gn.Type, "status": echo.NoticStatus_Unread}).Sort("-timestamp").One(&notice); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &notice, nil
}

func HasSameStarNotice(MDB *mgo.Database, gn *Notice) bool {
	c, err := GetNoticeCollection(MDB).Find(bson.M{"from_id": gn.FromID, "to_id": gn.ToID, "type": gn.Type}).Count()
	if err != nil {
		return false
	}
	return (c > 0)
}

//func GetOutTimeNotice (MDB *mgo.Database, gn *Notice) (*Notice, error) {
//	var notice Notice
//	if err := GetNoticeCollection(MDB).Find(bson.M{"from_id": gn.FromID, "to_id": gn.ToID, "type": gn.Type, "$not": bson.M{"status": echo.NoticStatus_OutTime}}).Sort("-timestamp").One(&notice); err != nil {
//		if err == mgo.ErrNotFound {
//			return nil, nil
//		}
//		return nil, err
//	}
//	return &notice, nil
//}

func SetNoticeStatus(MDB *mgo.Database, gn *Notice, status echo.NoticStatus) error {
	if err := GetNoticeCollection(MDB).Update(bson.M{"_id": gn.ID}, bson.M{
		"$set": bson.M{
			"status": status,
		},
	}); err != nil {
		return err
	}
	return nil
}

func SetNoticeType(MDB *mgo.Database, gn *Notice, t string) error {
	if err := GetNoticeCollection(MDB).Update(bson.M{"_id": gn.ID}, bson.M{
		"$set": bson.M{
			"type": t,
		},
	}); err != nil {
		return err
	}
	return nil
}

//ToData 输出AccountDynamics 的信息
func (nn Notice) ToData(mdb *mgo.Database) (d Dungeons, err error) {
	d = make(Dungeons)
	d[`id`] = nn.ID
	d[`user_id`] = nn.FromID
	d[`status_string`] = nn.Status.String()
	d[`status`] = nn.Status
	if nn.FromUser != nil {
		d[`from_user`], err = UserToData(mdb, nn.FromUser, &UserDataOption{})
		if err != nil {
			return nil, err
		}
	}
	if nn.ToUser != nil {
		d[`to_user`], err = UserToData(mdb, nn.ToUser, &UserDataOption{})
		if err != nil {
			return nil, err
		}
	}
	d[`type`] = nn.Type
	d[`message`] = nn.Content //json
	d[`timestamp`] = nn.Timestamp.String()
	return d, nil
}

type UserDataOption struct {
	FillSensitive bool
	FillToken     bool
	LiteData      bool
	DynamicData   bool
	CreateData    bool
}

type Location struct {
	Country  string `json:"country"`
	State    string `json:"state"`
	City     string `json:"city"`
	District string `json:"district"`
}

func Str2Time(ts string) time.Time {
	t, err := time.Parse(time.RFC3339, ts)
	if err != nil {
		return time.Time{}
	}
	return t
}

type AvatarType int

const (
	// AvatarTypeSystem 标示头像为系统默认
	AvatarTypeSystem AvatarType = 1 + iota
	// AvatarTypeNormal 标示头像为用户自定义
	AvatarTypeNormal
)

type UserAvatar struct {
	ID        bson.ObjectId `json:"id" bson:"_id,omitempty" json:"id"`
	UserUUID  string        `bson:"user_uuid" json:"user_uuid"`
	PhotoUUID string        `bson:"photo_uuid" json:"photo_uuid"`
	AvatarURL string        `bson:"avatar_url" json:"big_image_url"`
	Active    bool          `bson:"active" json:"active"`
	Type      AvatarType    `bson:"type" json:"type"`
	Timestamp time.Time     `bson:"timestamp" json:"timestamp"`
}

// SMSAccountCollectionName 方法, 返回 Collection 字段
func AvatarCollectionName() string {
	return "avatar"
}

// SMSAccountCollection 方法, 返回 Collection
func AvatarsCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(AvatarCollectionName())
}

func GetActiveAvatar(MDB *mgo.Database, uUUID string) (*UserAvatar, error) {
	var avatar UserAvatar
	if err := AvatarsCollection(MDB).Find(bson.M{"user_uuid": uUUID, "active": true}).One(&avatar); err != nil {
		if err == mgo.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &avatar, nil
}

func AvatarToData(a *UserAvatar) Dungeons {
	d := make(Dungeons)
	d[`id`] = a.ID
	d[`user_uuid`] = a.UserUUID
	d[`photo_uuid`] = a.PhotoUUID
	d[`big_image_url`] = a.AvatarURL
	d[`small_image_url`] = a.AvatarURL + "?imageView2/1/w/200/h/200"
	d[`active`] = a.Active
	d[`type`] = a.Type
	d[`timestamp`] = a.Timestamp
	return d
}

func UserToData(mdb *mgo.Database, u *echo.User, o *UserDataOption) (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = u.ID
	d[`uuid`] = u.UUID
	avatar, err := GetActiveAvatar(mdb, u.UUID)
	if avatar != nil && err == nil {
		d[`avatar`] = AvatarToData(avatar)
	}

	if o.LiteData {
		return d, nil
	}
	d[`nickname`] = u.Nickname.GetString()
	d[`followees`] = u.FolloweesCount.Int
	d[`followers`] = u.FollowersCount.Int
	if o.FillSensitive {
		d[`tuso_id`] = u.TusoID.GetString()
		if v := u.RealName; v != nil {
			d[`real_name`] = v
		}
		if o.DynamicData {
			return d, nil
		}
		if v := Str2Time(u.Birthday); v != (time.Time{}) {
			d[`birthday`] = v.Format(time.RFC3339)
		}
		if v := u.Gender; v != 0 {
			d[`gender`] = v.String()
		}
		if v := u.Location; v != nil {
			var l Location
			if err := json.Unmarshal([]byte(v.GetString()), &l); err != nil {
				return nil, err
			}
			d[`location`] = l
		}

		d[`friends`] = u.FriendsCount.Int
		d[`images`] = u.ImagesCount.Int
		d[`tusos`] = u.TusosCount.Int
	}
	//if o.CreateData {
	// 用户第一次上传图片的时候查询, 存入用户表, 然后每次查询用户表的时候查询是否有create_at的值 无就重新查询赋值, 有就忽略

	if u.FirstPhoto != "" {
		d[`photo_create_at`] = u.FirstPhoto
	}
	d[`user_create_at`] = u.CreatedAt
	d[`tuso_create_at`] = time.Now()
	//}
	if o.FillToken {
		d[`token`] = u.Token.GetString()
		d[`nuclear_key`] = u.NuclearKey.GetString()
	}
	return d, nil
}

type Dungeons map[string]interface{}

type DynamicsStatus int

const (
	DynamicsStatusRead DynamicsStatus = 1 + iota
	DynamicsStatusUnread
)

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

// CollectionName 方法, 返回 Notice 的 Collection
func GetNoticeCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C(MdbNoticeName)
}

//ToData 输出AccountDynamics 的信息
func (ad AccountDynamics) ToData() (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = ad.ID
	d[`user_uuid`] = ad.UserUUID
	d[`dyms_status`] = ad.DymsStatus
	//d[`title`] = ad.Title
	d[`type`] = ad.Type
	d[`message`] = ad.Mark
	d[`timestamp`] = ad.Timestamp
	d["user_rel"] = ad.UserRelation
	return d, nil
}

func Str2DynamicsStatus(str string) (DynamicsStatus, error) {
	switch str {
	case "1":
		return DynamicsStatusRead, nil
	case "2":
		return DynamicsStatusUnread, nil
	default:
		return 0, errors.New("The DynamicsStatus type is wrong , please try again!")
	}
}
