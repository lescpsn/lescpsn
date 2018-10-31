package wand

import (
	"git.ngs.tech/mean/athena/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
	"log"
)

const (
	FeedJob = "Feed"
)

func doFeedJob(ID int64) error {
	log.Println("do_feed_task: ", ID)
	news, err := model.GetNewsByID(ID)
	if err != nil {
		return err
	}
	if news.ID == 0 {
		log.Println("can not find the news")
	}
	var fIDs []int64
	friends_resp, err := Cl.FindUserFriends(context.TODO(), &FindByIDWithQPRequest{
		ID:             news.UserID,
		QueryParameter: &QueryParameter{},
	})
	if err != nil {
		return err
	}
	friends := friends_resp.UserRelations
	for _, v := range friends {
		fIDs = append(fIDs, v.ToID.Int)
	}
	followees_resp, err := Cl.FindUserFollowees(context.TODO(), &FindByIDWithQPRequest{
		ID:             news.UserID,
		QueryParameter: &QueryParameter{},
	})
	followees := followees_resp.UserRelations
	if err != nil {
		return err
	}
	for _, v := range followees {
		fIDs = append(fIDs, v.ToID.Int)
	}

	for _, v := range fIDs {
		feed := &model.Feed{}
		feed.UserID = v
		feed.NewsID = news.ID
		err := feed.ToMessageBox()
		if err != nil {
			log.Println(err)
		}
	}
	return nil
}
