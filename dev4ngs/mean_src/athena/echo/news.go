package echo

import (
	"git.ngs.tech/mean/athena/mars"
	"git.ngs.tech/mean/proto"
	"golang.org/x/net/context"

	"git.ngs.tech/mean/daniel/utils"
)

func (a Athena) GetAllUserNews(ctx context.Context, req *proto.AllUserNewsRequest, rsp *proto.AllUserNewsResponse ) error {
	a.Context(ctx)

	newsArray, totalNum, err := mars.FindAllUserNews(a.MDB, req.OffsetHead, req.OffsetTail,utils.Str2Time(req.StartTime),utils.Str2Time(req.EndTime))
	if err != nil {
		return err
	}
	rsp.TusoList = newss2echo(newsArray)
	rsp.Count = int64(totalNum)


	return nil
}
