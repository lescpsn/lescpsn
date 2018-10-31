package model

import (
	"git.ngs.tech/mean/athena/config"
	"git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"strconv"
)

const DB_Feeds = "feeds"

type Feed struct {
	//ID     int64       `bson:"_id"`
	ID     int64       `bson:"id"`
	User   *proto.User `bson:"-"`
	UserID int64       `bson:"user_id"`

	News   *News `bson:"-"`
	NewsID int64 `bson:"news_id"`
}

func (s *Feed) ToMessageBox() error {
	_, mdb := GetMDBAndMSession(config.GetMongoConf())
	change := mgo.Change{
		Update:    bson.M{"$inc": bson.M{"id": 1}},
		ReturnNew: true,
		Upsert:    true,
	}
	type P struct {
		Name string `bson:"name"`
		ID   int64  `bson:"id"`
	}
	var doc P
	_, err := mdb.C("feeds_auto_inc").Find(bson.M{"name": "feed_box_" + strconv.Itoa(int(s.UserID))}).Apply(change, &doc)
	if err != nil {
		return err
	}
	s.ID = doc.ID
	mdb.C(DB_Feeds).Insert(s)
	return nil
}

func CountFeeds(user *proto.User, q *proto.QueryParameter) (int, error) {
	mdb := GetMongo()
	query := mdb.C(DB_Feeds)
	where := bson.M{}
	where["user_id"] = user.ID
	offset := int(q.Page * q.Count)
	return query.Find(where).Skip(offset).Count()
}

func FindFeedsByUserID(user *proto.User, q *proto.QueryParameter, Cl proto.DreamServicesClient) ([]*Feed, error) {
	mdb := GetMongo()
	query := mdb.C(DB_Feeds)
	var feeds []*Feed
	where := bson.M{}
	where_id := bson.M{}
	if q.MaxID != 0 {
		where_id["$lte"] = q.MaxID
	}
	if q.SinceID != 0 {
		where_id["$gte"] = q.SinceID
	}
	if len(where_id) > 0 {
		where["id"] = where_id
	}
	where["user_id"] = user.ID
	query.Find(where).Skip(int(q.Page * q.Count)).Limit(int(q.Count)).All(&feeds)
	//获取news
	var uIDs []int64
	var nIDs []int64
	for _, v := range feeds {
		nIDs = append(nIDs, v.NewsID)
	}
	//获取news
	news, err := GetNewsByIDs(nIDs, Cl)
	if err != nil {
		return nil, err
	}
	//获取每个news的用户的id
	for _, v := range news {
		uIDs = append(nIDs, v.UserID)
	}
	UsersResp, err := Cl.GetUserByIDs(context.TODO(), &proto.GetByIDsRequest{
		Ids: uIDs,
	})
	if err != nil {
		return nil, err
	}
	users := UsersResp.User
	if err != nil {
		return nil, err
	}

	for k, v := range news {
		for _, vv := range users {
			if v.UserID == vv.ID {
				news[k].User = vv
			}
		}
	}
	for k, v := range feeds {
		for _, vv := range news {
			if vv.ID == v.NewsID {
				feeds[k].News = vv
			}
		}
		feeds[k].User = user
	}
	return feeds, nil
}
