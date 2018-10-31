package wand

import (
	"git.ngs.tech/mean/athena/config"
	"github.com/micro/go-micro/broker"
	"github.com/micro/go-plugins/broker/kafka"
	"log"
	"strconv"
)

const (
	FeedBrokerTopic   = "feed"
	NoticeBrokerTopic = "notice"

	brokerType = "type"
	brokerkey  = "key"

	CreateNoticeJob     = "CreateNotice"
	CreateStarNoticeJob = "CreateStarNotice"
)

const (
	MESSAGE_TYPE_COMMENT_IMAGES = "MESSAGE_TYPE_COMMENT_IMAGES" //图片留言
	MESSAGE_TYPE_COMMENT_NEWS   = "MESSAGE_TYPE_COMMENT_NEWS"   //图说评论

	MESSAGE_TYPE_STARRED_NEWS = "MESSAGE_TYPE_STARRED_NEWS" //图说点赞
	MESSAGE_TYPE_SYSTEM       = "MESSAGE_TYPE_SYSTEM"       //系统消息
)

func handle(p broker.Publication) error {
	bt := p.Message().Header[brokerType]
	idString := p.Message().Header[brokerkey]
	id, err := strconv.Atoi(idString)
	if err != nil {
		log.Println("id fromat error")
		return err
	}
	switch bt {
	case FeedJob:
		err := doFeedJob(int64(id))
		if err != nil {
			log.Println(err)
		}
		return err
	default:
		log.Println(p.Message().Header)
	}
	return nil
}

func Register(o *broker.Options) {
	o = &broker.Options{
		Addrs: config.GetKafkaConfig().KafkaNodes,
	}
}

func NewBroker() broker.Broker {
	b := kafka.NewBroker(Register)
	err := b.Connect()
	if err != nil {
		log.Println(err)
	}
	_, err = b.Subscribe(FeedBrokerTopic, handle)
	if err != nil {
		log.Println(err)
	}
	return b
}
