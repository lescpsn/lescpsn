package model

import (
	"git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"log"
	"time"
)

const DB_News_Star_Name = "news_star"

const DB_News = "news"

type NewsStarType int32

type News struct {
	ID   int64  `bson:"_id"`
	UUID string `bson:"uuid"`
	//TODO 目前这边存time.Time 需要查看数据库是否是的
	CreatedAt time.Time `bson:"create_at"`
	UpdatedAt time.Time `bson:"update_at"`
	DeletedAt time.Time `bson:"delete_at"`

	User   *proto.User `bson:"-"`
	UserID int64       `bson:"user_id"`

	Photos   []*proto.Photo `bson:"-"`
	PhotoIDs []int64        `bson:"photo_ids"`

	PhotoCount   int `bson:"photo_count"`
	CommentCount int `bson:"comment_count"`
	StarredCount int `bson:"starred_count"`

	Timestamp time.Time `bson:"timestamp"`
}

const (
	NewsStarType_news_star_type_null        NewsStarType = 0
	NewsStarType_news_star_type_deactivated NewsStarType = 1
	NewsStarType_news_star_type_activated   NewsStarType = 2
)

var NewsStarType_name = map[int32]string{
	0: "news_star_type_null",
	1: "news_star_type_deactivated",
	2: "news_star_type_activated",
}

func (x NewsStarType) String() string {
	s, ok := NewsStarType_name[int32(x)]
	if ok {
		return s
	}
	//return strconv.Itoa(int(x))
	return ""
}

type NewsStar struct {
	ID           int64        `bson:"_id"`
	TimesTamp    time.Time    `bson:"timestamp"`
	User         *proto.User  `bson:"-"`
	UserID       int64        `bson:"user_id"`
	News         *News        `bson:"-"`
	NewsID       int64        `bson:"news_id"`
	NewsStarType NewsStarType `bson:"newstar_type"`
}

func NewsToData(news *News, rUser *proto.User) (Dungeons, error) {
	var err error
	d := make(Dungeons)
	d[`id`] = news.ID
	d[`uuid`] = news.UUID
	d[`photo_count`] = news.PhotoCount
	d[`comment_count`] = news.CommentCount
	d[`starred_count`] = news.StarredCount
	d[`timestamp`] = news.Timestamp
	if news.User != nil {
		d[`user`], err = UserToData(news.User, &UserDataOption{FillSensitive: true})
		if err != nil {
			return nil, err
		}
	}

	var pd []Dungeons
	if len(news.Photos) == 0 {
		return nil, nil
	}
	for _, v := range news.Photos {
		if v.PhotoPrivacy == proto.PhotoPrivacy_photo_privacy_private {
			continue
		}
		d, err := PhotoToData(v, &PhotoDataOption{FillSensitive: false})
		if err != nil {
			log.Println(err, d)
			continue
		}
		pd = append(pd, d)
	}
	if len(pd) == 0 {
		return nil, nil
	}
	d[`images`] = pd
	return d, nil
}

func NewsStarToData(ns *NewsStar, cu *proto.User) (Dungeons, error) {
	tu := ns.User
	d := make(Dungeons)
	if tu != nil {
		tuData, err := UserToData(tu, &UserDataOption{FillSensitive: false, FillToken: false})
		if err != nil {
			return nil, err
		}
		d[`star_user`] = tuData
	}
	d[`id`] = ns.ID
	d[`star_type`] = ns.NewsStarType
	d[`star_type_string`] = ns.NewsStarType.String()
	d[`news_id`] = ns.NewsID
	d[`timestamp`] = ns.TimesTamp
	return d, nil
}

func NewNews(userID int64, Photos []*proto.Photo, timestamp time.Time) (*News, error) {
	newNews := News{
		UUID:         uuid.NewV4().String(),
		UserID:       userID,
		CreatedAt:    time.Now(),
		Photos:       Photos,
		PhotoCount:   len(Photos),
		CommentCount: 0,
		StarredCount: 0,
		Timestamp:    timestamp,
	}
	var ids []int64
	for _, v := range Photos {
		ids = append(ids, v.ID)
	}
	mdb := GetMongo()
	ais, err := GetAutoIncID("news", mdb)
	if err != nil {
		return nil, err
	}
	newNews.ID = ais.ID
	newNews.PhotoIDs = ids
	err = mdb.C(DB_News).Insert(newNews)
	if err != nil {
		return nil, err
	}
	return &newNews, nil
}

func (n *News) Delete() error {
	n.DeletedAt = time.Now()
	err := mdb.C(DB_News).Update(bson.M{
		"_id": n.ID,
	}, n)
	mdb.C(DB_Feeds).RemoveAll(bson.M{"news_id": n.ID})
	return err
}

func (n *News) IncrementStarredCount(a int) error {
	mdb := GetMongo()
	err := mdb.C(DB_News).Update(bson.M{
		"_id": n.ID,
	}, bson.M{
		"$inc": bson.M{
			"starred_count": a,
		},
	})
	return err
}

func CountNewsByUserID(uid int64, q *proto.QueryParameter) (int, error) {
	mdb := GetMongo()
	where := bson.M{}
	where["user_id"] = uid
	where["delete_at"] = bson.M{
		"$lte": time.Time{},
	}
	return mdb.C(DB_News).Find(where).Skip(int(q.Count * q.Page)).Count()
}

func FindNewsByUser(user *proto.User, q *proto.QueryParameter, Cl proto.DreamServicesClient) ([]*News, error) {
	mdb := GetMongo()
	var newss []*News
	var err error
	//查询该用户的并且没有删除的图说
	where := bson.M{}
	where_id := bson.M{}
	if q.MaxID != 0 {
		where_id["$lte"] = q.MaxID
	}
	if q.MaxID != 0 {
		where_id["$gte"] = q.SinceID
	}
	where["user_id"] = user.ID
	where["delete_at"] = bson.M{
		"$lte": time.Time{},
	}
	if len(where_id) != 0 {
		where["_id"] = where_id
	}
	if q.OrderBy != "" {
		err = mdb.C(DB_News).Find(where).Skip(int(q.Page * q.Count)).Limit(int(q.Count)).Sort(q.OrderBy).All(&newss)
	} else {
		err = mdb.C(DB_News).Find(where).Skip(int(q.Page * q.Count)).Limit(int(q.Count)).All(&newss)
	}
	if err != nil {
		return nil, err
	}
	var pIDs []int64
	for _, v := range newss {
		for _, vv := range v.PhotoIDs {
			pIDs = append(pIDs, vv)
		}
	}
	fPRsp, err := Cl.FindPhotoByIDs(context.TODO(), &proto.IDsWithEchoOptionRequest{
		Ids:             pIDs,
		PhotoEchoOption: &proto.PhotoEchoOption{FetchBasePhoto: true, FetchNote: true},
	})
	if err != nil {
		return nil, err
	}
	photos := fPRsp.Photos
	//TODO 感觉这么多层循环有点...
	for k, v := range newss {
		for _, pid := range v.PhotoIDs {
			for _, vv := range photos {
				if pid == vv.ID && vv.PhotoPrivacy != proto.PhotoPrivacy_photo_privacy_private  {
					newss[k].Photos = append(newss[k].Photos, vv)
				}
			}
		}
		newss[k].User = user
	}

	return newss, nil
}

func GetNewsByUUID(uuid string) (*News, error) {
	mdb := GetMongo()
	var news News
	err := mdb.C(DB_News).Find(bson.M{
		"uuid": uuid,
		"delete_at": bson.M{
			"$lte": time.Time{},
		},
	}).One(&news)
	if err != nil {
		return nil, err
	}
	return &news, nil
}

func GetNewsByIDs(ids []int64, Cl proto.DreamServicesClient) ([]*News, error) {
	mdb := GetMongo()
	var newss []*News
	err := mdb.C(DB_News).Find(bson.M{
		"_id": bson.M{
			"$in": ids,
		},
		"delete_at": bson.M{
			"$lte": time.Time{},
		},
	}).All(&newss)
	var pIDs []int64
	for _, v := range newss {
		for _, vv := range v.PhotoIDs {
			pIDs = append(pIDs, vv)
		}
	}
	fPRsp, err := Cl.FindPhotoByIDs(context.TODO(), &proto.IDsWithEchoOptionRequest{
		Ids:             pIDs,
		PhotoEchoOption: &proto.PhotoEchoOption{FetchBasePhoto: true, FetchNote: true},
	})
	if err != nil {
		return nil, err
	}
	photos := fPRsp.Photos
	//TODO 感觉这么多层循环有点...
	for k, v := range newss {
		for _, pid := range v.PhotoIDs {
			for _, vv := range photos {
				if pid == vv.ID && vv.PhotoPrivacy != proto.PhotoPrivacy_photo_privacy_private {
					newss[k].Photos = append(newss[k].Photos, vv)
				}
			}
		}
	}
	return newss, err
}

func GetNewsByID(id int64) (*News, error) {
	mdb := GetMongo()
	var news News
	err := mdb.C(DB_News).Find(bson.M{
		"_id": id,
		"delete_at": bson.M{
			"$lte": time.Time{},
		},
	}).One(&news)
	return &news, err
}

func NewNewsStar(user *proto.User, news *News) (*NewsStar, error) {
	mdb := GetMongo()
	var ts NewsStar
	err := mdb.C("news_star").Find(bson.M{
		"user_id": user.ID,
		"news_id": news.ID,
	}).One(&ts)
	if err != nil && err != mgo.ErrNotFound {
		return nil, err
	}
	if err != mgo.ErrNotFound && ts.NewsStarType == NewsStarType_news_star_type_activated {
		return &NewsStar{
			User:         user,
			UserID:       user.ID,
			News:         news,
			NewsID:       news.ID,
			NewsStarType: NewsStarType_news_star_type_activated,
		}, nil
	} else if err != mgo.ErrNotFound {
		//如果存在数据并且不为activced
		err = mdb.C(DB_News_Star_Name).Update(bson.M{
			"_id": ts.ID,
		}, bson.M{
			"newstar_type": NewsStarType_news_star_type_activated,
			"times_tamp":   time.Now(),
		})
		if err != nil {
			return nil, err
		}
		ts.NewsStarType = NewsStarType_news_star_type_activated
		ts.User = user
	} else {
		ts = NewsStar{
			User:         user,
			UserID:       user.ID,
			News:         news,
			NewsID:       news.ID,
			NewsStarType: NewsStarType_news_star_type_activated,
			TimesTamp:    time.Now(),
		}
		ais, err := GetAutoIncID("news_star", mdb)
		if err != nil {
			return nil, err
		}
		ts.ID = ais.ID
		err = mdb.C(DB_News_Star_Name).Insert(ts)
		if err != nil {
			return nil, err
		}
	}
	err = news.IncrementStarredCount(1)
	if err != nil {
		//TODO 事务需要支持 之后添加基于事件的补偿
		log.Println("IncrementStarredCount err ", err)
		return nil, err
	}
	return &ts, nil
}

func NewsUnStar(user *proto.User, news *News) (*NewsStar, error) {
	mdb := GetMongo()
	var ns NewsStar
	err := mdb.C("news_star").Find(bson.M{
		"user_id": user.ID,
		"news_id": news.ID,
	}).One(&ns)
	if err != nil && err != mgo.ErrNotFound {
		return nil, err
	}
	if err != mgo.ErrNotFound && ns.NewsStarType == NewsStarType_news_star_type_activated {
		//如果存在数据并且不为activced
		ns.NewsStarType = NewsStarType_news_star_type_deactivated
		ns.TimesTamp = time.Now()
		err = mdb.C(DB_News_Star_Name).Update(bson.M{
			"_id": ns.ID,
		}, ns)
		if err != nil {
			return nil, err
		}
		ns.NewsStarType = NewsStarType_news_star_type_deactivated
		err = news.IncrementStarredCount(-1)
		if err != nil {
			return nil, err
		}
	}
	ns.User = user
	return &ns, nil
}
func GetStarsByNewsID(tu *News, q *proto.QueryParameter, Cl proto.DreamServicesClient) (nss []*NewsStar, err error) {
	mdb := GetMongo()
	where := bson.M{}
	where_id := bson.M{}
	if q.MaxID != 0 {
		where_id["$lte"] = q.MaxID
	}
	if q.MaxID != 0 {
		where_id["$gte"] = q.SinceID
	}
	where["news_id"] = tu.ID
	if len(where_id) > 0 {
		where["_id"] = where_id
	}
	if q.OrderBy != "" {
		err = mdb.C(DB_News_Star_Name).Find(where).Skip(int(q.Count * q.Page)).Limit(int(q.Count)).Sort(q.OrderBy).All(&nss)
	} else {
		err = mdb.C(DB_News_Star_Name).Find(where).Skip(int(q.Count * q.Page)).Limit(int(q.Count)).All(&nss)
	}
	if err != nil {
		return nil, err
	}
	var uIDs []int64
	for _, v := range nss {
		uIDs = append(uIDs, v.UserID)
	}
	UsersResp, err := Cl.GetUserByIDs(context.TODO(), &proto.GetByIDsRequest{
		Ids: uIDs,
	})
	if err != nil {
		return nil, err
	}
	users := UsersResp.User
	for k, v := range nss {
		for _, vv := range users {
			if v.UserID == vv.ID {
				nss[k].User = vv
			}
		}
	}
	return nss, nil
}

func GetStarState(u *proto.User, news *News) (*NewsStar, error) {
	var ns = NewsStar{}
	err := mdb.C(DB_News_Star_Name).Find(bson.M{
		"news_id": news.ID,
		"user_id": u.ID,
	}).One(&ns)
	if err == mgo.ErrNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &ns, nil
}

func FindStarsByNewsIDs(ids []int64) ([]*NewsStar, error) {
	var ns []*NewsStar
	err := mdb.C(DB_News_Star_Name).Find(bson.M{
		"news_id": bson.M{
			"$in": ids,
		},
	}).All(&ns)
	if err == mgo.ErrNotFound {
		return nil, nil
	}
	return ns, err
}
