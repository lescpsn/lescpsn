package huston

import (
	"git.ngs.tech/mean/houston/config"
	"github.com/micro/go-micro/broker"
	"github.com/micro/go-plugins/broker/kafka"
	//"gopkg.in/mgo.v2/bson"
	"log"
)

const (
	NoticeBrokerTopic        = "notice"
	brokerType               = "type"
	brokerkey                = "key"
	CreateNoticeJob          = "CreateNotice"
	RelationFollowNoticeJob  = "RelationFollowNotice"
	RelationRequestNoticeJob = "RelationRequestNotice"
	RelationFriendsNoticeJob = "RelationFriendsNoticeJob"
)

func BrokerRegister(o *broker.Options) {
	o = &broker.Options{
		Addrs: config.GetKafkaConfig().KafkaNodes,
	}
}

func NewBroker() broker.Broker {
	b := kafka.NewBroker(BrokerRegister)
	err := b.Connect()
	if err != nil {
		log.Println(err)
	}
	return b
}
