package model

import (
	"errors"
	"gopkg.in/mgo.v2"
)

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

// CollectionName 方法, 返回 AccountDynamics 的 Collection
func GetAccountDynamicsCollection(MDB *mgo.Database) *mgo.Collection {
	return MDB.C("account_dynamics")
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
