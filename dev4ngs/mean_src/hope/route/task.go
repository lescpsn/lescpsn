package route

import (
	"git.ngs.tech/mean/hope/config"
	"git.ngs.tech/mean/hope/model"
	proto_struct "git.ngs.tech/mean/proto"
	"github.com/golang/protobuf/proto"
	"github.com/micro/go-micro/broker"
	"gopkg.in/mgo.v2"
	"log"
	"time"
)

const (
	hopeBrokerTopic          = "notice"
	brokerType               = "type"
	brokerkey                = "key"
	CreateNoticeJob          = "CreateNotice"
	CreateStarNoticeJob      = "CreateStarNotice"
	RelationFollowNoticeJob  = "RelationFollowNotice"
	RelationRequestNoticeJob = "RelationRequestNotice"
	RelationFriendsNoticeJob = "RelationFriendsNoticeJob"
)

func NoticeHandle(p broker.Publication) error {
	_, MDB := config.GetMDBAndMSession(config.GetMongoConf())
	bt := p.Message().Header[brokerType]
	log.Println("task start:", bt)
	switch bt {
	case CreateNoticeJob:
		echoNotice := proto_struct.Notice{}
		proto.Unmarshal(p.Message().Body, &echoNotice)
		notice := model.Echo2Notice(echoNotice)
		return NewNotice(MDB, &notice)
	case CreateStarNoticeJob:
		echoNotice := proto_struct.Notice{}
		proto.Unmarshal(p.Message().Body, &echoNotice)
		notice := model.Echo2Notice(echoNotice)
		b := model.HasSameStarNotice(MDB, &notice)
		//判断是否有相同的点赞信息
		if b {
			return nil
		}
		return NewNotice(MDB, &notice)

	case RelationFollowNoticeJob:
		echoNotice := proto_struct.Notice{}
		proto.Unmarshal(p.Message().Body, &echoNotice)
		notice := model.Echo2Notice(echoNotice)

		fNotice, err := model.GetUnReadNotice(MDB, &notice)
		if err != nil {
			return err
		}
		// 若未读或在 24 小时之内，则不收取这人的关注动态
		if fNotice != nil {
			// 判断上一条同类动态是否在 24 小时之内
			aDayBefore := time.Now().AddDate(0, 0, -1)
			outTime := fNotice.Timestamp.After(aDayBefore)
			if outTime {
				return nil
			}
		}
		return NewNotice(MDB, &notice)

	case RelationRequestNoticeJob:
		echoNotice := proto_struct.Notice{}
		proto.Unmarshal(p.Message().Body, &echoNotice)
		notice := model.Echo2Notice(echoNotice)

		// 新来的好友申请, 插入动态, 老的则置为 过期
		rNotice, err := model.GetNoticeByType(MDB, &notice, notice.Type)
		if err != nil {
			return err
		}
		if rNotice == nil {
			return NewNotice(MDB, &notice)
		}
		if rNotice.Status != proto_struct.NoticStatus_OutTime {
			rNotice.Status = proto_struct.NoticStatus_OutTime
			err := model.SetNoticeStatus(MDB, rNotice, proto_struct.NoticStatus_OutTime)
			if err != nil {
				return err
			}
		}
		return NewNotice(MDB, &notice)

	case RelationFriendsNoticeJob:
		echoNotice := proto_struct.Notice{}
		proto.Unmarshal(p.Message().Body, &echoNotice)
		notice := model.Echo2Notice(echoNotice)

		// 好友申请为拒绝, 则修改原动态, 并更新
		if notice.Type == model.MESSAGE_TYPE_RELATION_REFUSE {
			rNotice, err := model.GetNoticeByID(MDB, &notice)
			if err != nil {
				return err
			}
			err = model.SetNoticeType(MDB, rNotice, model.MESSAGE_TYPE_RELATION_REFUSE)
			if err != nil {
				return err
			}
			return nil
		}
		if notice.Type == model.MESSAGE_TYPE_RELATION_AGREED {
			rNotice, err := model.GetNoticeByID(MDB, &notice)
			if err != nil {
				return err
			}
			err = model.SetNoticeType(MDB, rNotice, model.MESSAGE_TYPE_RELATION_AGREED)
			if err != nil {
				return nil
			}
			notice.FromID = notice.ToID
			notice.ToID = notice.FromID
			notice.Type = model.MESSAGE_TYPE_RELATION_WAS_AGREED
			return NewNotice(MDB, &notice)
		}

	default:
		log.Println(p.Message().Header)
	}
	return nil
}

func NewNotice(MDB *mgo.Database, nn *model.Notice) error {
	return model.NewNotice(MDB, nn)
}
