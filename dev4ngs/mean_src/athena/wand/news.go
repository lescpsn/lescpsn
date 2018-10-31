package wand

import (
	"encoding/json"
	"git.ngs.tech/mean/athena/model"
	. "git.ngs.tech/mean/proto"
	"github.com/golang/protobuf/proto"
	"github.com/micro/go-micro/broker"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"log"
	"strconv"
	"time"
)

func NewsPhotoJudgement(user *User, images []*Photo) error {
	if len(images) > 9 {
		return TooManyPhotoErr
	}
	if len(images) == 0 {
		return NotEnoughPhotoErr
	}
	//TODO 添加判断
	for _, image := range images {
		if user.ID != image.User.ID {
			return InsufficientPermissionsErr
		}
	}
	return nil
}

func (m *AthenaController) NewNews(cu *User, iUUIDs []uuid.UUID, timestamp time.Time) (model.Dungeons, error) {
	fPRsp, err := Cl.FindPhotoByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           model.UUIDs2Strs(iUUIDs),
		PhotoEchoOption: &PhotoEchoOption{FetchBasePhoto: true, FetchUser: true},
	})
	is := fPRsp.Photos
	if err != nil {
		return nil, err
	}

	errors := NewsPhotoJudgement(cu, is)
	if errors != nil {
		return nil, errors
	}

	news, err := model.NewNews(cu.ID, is, timestamp)
	if err != nil {
		return nil, err
	}
	news.User = cu
	tData, err := model.NewsToData(news, cu)
	if err != nil {
		return nil, err
	}

	pHeader := map[string]string{
		brokerType: FeedJob,
		brokerkey:  strconv.Itoa(int(news.ID)),
	}
	err = m.Broker.Publish(FeedBrokerTopic, &broker.Message{Header: pHeader})
	if err != nil {
		//TODO 处理分发错误
		log.Println(err)
	}
	return tData, nil
}

func (m *AthenaController) DeleteNews(cu *User, uuid uuid.UUID) (model.Dungeons, error) {

	news, err := model.GetNewsByUUID(uuid.String())
	if err != nil {
		return nil, err
	}
	if news.UserID != cu.ID {
		return nil, InsufficientPermissionsErr
	}
	err = news.Delete()
	if err != nil {
		return nil, err
	}
	return model.NewsToData(news, cu)
}

//GetSingleNews 获取单条图说
func (m *AthenaController) GetSingleNews(cu *User, nUUID uuid.UUID) (model.Dungeons, error) {
	news, err := model.GetNewsByUUID(nUUID.String())
	if err != nil {
		panic(err)
	}
	if news == nil {
		panic(NewsNotFoundErr)
	}
	fPRsp, err := Cl.FindPhotoByIDs(context.TODO(), &IDsWithEchoOptionRequest{
		Ids:             news.PhotoIDs,
		PhotoEchoOption: &PhotoEchoOption{FetchBasePhoto: true, FetchNote: true},
	})
	if err != nil {
		return nil, err
	}
	news.Photos = fPRsp.Photos
	//不是自己的图说的话权限不足
	//if news.ID != cu.ID {
	//	panic(InsufficientPermissionsErr)
	//}

	gURsp, err := Cl.GetUserByID(context.TODO(), &GetByIDRequest{
		Id: news.UserID,
	})
	if err != nil {
		return nil, err
	}
	if gURsp.Null {
		return nil, UserNotFoundErr
	}
	u := gURsp.User
	news.User = u
	ns, err := model.GetStarState(cu, news)
	if err != nil {
		panic(err)
	}
	var d model.Dungeons
	d, err = model.NewsToData(news, cu)
	if err != nil {
		panic(err)
	}
	log.Print(d)
	if ns != nil {
		d["star"], err = model.NewsStarToData(ns, cu)
		if err != nil {
			panic(err)
		}
	}
	return d, nil
}

func (m *AthenaController) GetUserNews(cu *User, uUUID uuid.UUID, options *QueryParameter) (model.Dungeons, error) {
	gURsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: uUUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if gURsp.Null {
		return nil, UserNotFoundErr
	}
	u := gURsp.User
	news, err := model.FindNewsByUser(u, options, Cl)
	if err != nil {
		return nil, err
	}
	count, err := model.CountNewsByUserID(u.ID, options)
	if err != nil {
		return nil, err
	}
	ds := []model.Dungeons{}
	for _, v := range news {
		//TODO
		v.User = u
		d, _ := model.NewsToData(v, cu)
		if d == nil {
			continue
		}
		ds = append(ds, d)
	}
	d := model.Dungeons{}
	d["list"] = ds
	d["more"] = false
	if count > int(options.Count) {
		d["more"] = true
	}
	return d, nil
}

func (m *AthenaController) GetFeeds(cu *User, options *QueryParameter) (model.Dungeons, error) {
	feeds, err := model.FindFeedsByUserID(cu, options, Cl)
	if err != nil {
		return nil, err
	}
	count, err := model.CountFeeds(cu, options)
	if err != nil {
		return nil, err
	}
	d := model.Dungeons{}
	ds := []model.Dungeons{}
	var nids = []int64{}
	for _, feed := range feeds {
		nids = append(nids, feed.NewsID)
	}
	stars, err := model.FindStarsByNewsIDs(nids)
	if err != nil {
		return nil, err
	}
	for _, feed := range feeds {
		//TODO 进行过滤放置图片不存在等情况发生
		d, err := model.NewsToData(feed.News, cu)
		if err != nil {
			log.Println(err)
			continue
		}
		if d == nil {
			continue
		}
		d["star"] = false
		for _, star := range stars {
			if star.NewsID == feed.NewsID {
				d["star"] = true
			}
		}
		ds = append(ds, d)
	}
	d["more"] = false
	if count > int(options.Count) {
		d["more"] = true
	}
	d["list"] = ds
	return d, nil
}

func (m *AthenaController) NewsStars(cu *User, tUUID uuid.UUID) (model.Dungeons, error) {
	tu, err := model.GetNewsByUUID(tUUID.String())
	if err != nil {
		return nil, NewsNotFoundErr
	}
	if tu == nil {
		return nil, NewsNotFoundErr
	}
	//如果是owner则不能点赞
	if cu.ID == tu.UserID {
		//return nil, NewsStarForbidden
	}
	star, err := model.NewNewsStar(cu, tu)
	if err != nil {
		return nil, err
	}
	//TODO WTF? newsStar 的 ToData
	tData, err := model.NewsStarToData(star, cu)
	if err != nil {
		return nil, err
	}
	c, err := json.Marshal(map[string]interface{}{
		"news_id": star.NewsID,
	})
	message_body, err := proto.Marshal(&Notice{
		FromID:  cu.ID,
		ToID:    star.News.UserID,
		Title:   "",
		Type:    MESSAGE_TYPE_STARRED_NEWS,
		Content: string(c),
	})
	if err != nil {
		return nil, err
	}
	m.Broker.Publish(NoticeBrokerTopic, &broker.Message{
		Header: map[string]string{
			brokerType: CreateStarNoticeJob,
		},
		Body: message_body,
	})
	return tData, nil
}

func (m *AthenaController) NewsUnStar(cu *User, tUUID uuid.UUID) (model.Dungeons, error) {
	tu, err := model.GetNewsByUUID(tUUID.String())
	if err != nil {
		return nil, NewsNotFoundErr
	}

	uStarRsp, err := model.NewsUnStar(cu, tu)
	if err != nil {
		return nil, err
	}
	tData, err := model.NewsStarToData(uStarRsp, cu)
	if err != nil {
		log.Println("NewsUnStar err", err)
		return nil, err
	}
	return tData, nil
}

func (m *AthenaController) FindNewsStar(cu *User, tUUID uuid.UUID, options *QueryParameter) ([]model.Dungeons, error) {
	news, err := model.GetNewsByUUID(tUUID.String())
	if err != nil {
		return nil, NewsNotFoundErr
	}

	stars, err := model.GetStarsByNewsID(news, options, Cl)
	if err != nil {
		return nil, err
	}
	if stars == nil {
		return nil, NewsStarrNotFoundErr
	}
	ds := []model.Dungeons{}
	for _, t := range stars {
		d, err := model.NewsStarToData(t, cu)
		if err != nil {
			return ds, err
		}
		ds = append(ds, d)
	}
	return ds, nil
}
