package hera

import (
	"git.ngs.tech/mean/hera/model"
	"git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
	"strconv"
	"strings"
)


func (m *HeraController) GetAllUserTuso(offsetHead, offsetTail int64,startTime,endTime string) (model.Dungeons, error) {

	rps:=&proto.AllUserNewsRequest{
		OffsetHead: offsetHead,
		OffsetTail: offsetTail,
	}

	if  len(strings.TrimSpace(startTime))>0 {

		rps.StartTime=startTime

	}

	if  len(strings.TrimSpace(endTime))>0 {

		rps.EndTime=endTime

	}

	result, err := Cathena.GetAllUserNews(context.TODO(), rps)

	if err != nil {

		return nil, err

	}
	ds := model.Dungeons{}
	usr := model.Dungeons{}
	TusoList:=[]model.Dungeons{}


	rp := proto.GetByIDsRequest{}

	for _, v := range result.TusoList {
		rp.Ids = append(rp.Ids, v.UserID)
	}

	rs, _ := Cl.GetUserByIDs(context.TODO(), &rp)

	for _, v := range rs.User {
		usr[strconv.FormatInt(v.ID, 10)] = v
	}
	for _, v := range result.TusoList {
		//TODO
		//if usr[strconv.FormatInt(v.ID, 10)] == nil {
		//	continue
		//}
		cu := usr[strconv.FormatInt(v.UserID, 10)].(*proto.User)
		v.User=cu
		d, err := model.NewsToData(m.MDB, v)

		if err != nil {
			panic(err)
		}
		TusoList = append(TusoList, d)
	}

	ds["list"] = TusoList
	ds["count"] = result.Count

	return ds, nil
}
