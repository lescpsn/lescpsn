package mars

import (
	. "git.ngs.tech/mean/athena/model"
	"gopkg.in/mgo.v2"

	"git.ngs.tech/mean/athena/wand"
	"golang.org/x/net/context"
	"git.ngs.tech/mean/proto"
	"gopkg.in/mgo.v2/bson"
	"time"
)

func FindAllUserNews(MDB *mgo.Database, startRecord, endRecord int64,startTime,endTime time.Time) ([]*News, int, error) {
	var tusoList []*News
	limitRecord := int(endRecord - startRecord)

	//totalNum mongodb中所有用户图说的总数，而非查询返回的条数
	totalNum, _ := MDB.C(DB_News).Find(nil).Count()

	//起始，终止参数支持负数,整数代表从头部计算，负数代表从尾部计算
	skipRecord := int(startRecord)
	if startRecord < 0 {
		skipRecord = totalNum + int(startRecord)
	}
	where := bson.M{}
	where["delete_at"] = bson.M{
		"$lte": time.Time{},
	}

	if !startTime.IsZero() {
		where["timestamp"]= bson.M{
			"$gte": startTime,
		}
	}

	if !endTime.IsZero() {
		where["timestamp"]= bson.M{
			"$lte": endTime,
		}
	}

	err := MDB.C(DB_News).Find(where).Sort("-timestamp").Skip(skipRecord).Limit(limitRecord).All(&tusoList)
	if err != nil {
		return nil, -1, err
	}

	var pIDs []int64

	for _, v := range tusoList {
		for _, vv := range v.PhotoIDs {
			pIDs = append(pIDs, vv)
		}
	}

	fPRsp, err := wand.Cl.FindPhotoByIDs(context.TODO(), &proto.IDsWithEchoOptionRequest{
		Ids:             pIDs,
		PhotoEchoOption: &proto.PhotoEchoOption{FetchBasePhoto: true, FetchNote: true},
	})
	if err != nil {
		return nil, 0, err
	}

	photos := fPRsp.Photos
	for k, v := range tusoList {
		for _, pid := range v.PhotoIDs {
			for _, vv := range photos {
				if pid == vv.ID {
					tusoList[k].Photos = append(tusoList[k].Photos, vv)
				}
			}
		}
	}

	return tusoList, totalNum, nil
}
