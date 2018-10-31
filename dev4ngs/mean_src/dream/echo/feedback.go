package echo

import (
	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
)

// AddFeedBack 可以将其一个 FeedbackEcho 对象持久化保存在数据库中, 同时将保存后的
// FeedbackEcho 对象返回
func (d Dream) AddFeedBack(ctx context.Context, req *PostFeedbackRequest, rsp *Feedback) error {
	d.Context(ctx)
	f := echo2Feedback(req.Feedback)
	// 如果已经有主键了, 那么就应当调用更新的方法, 而不是再次保存为新评论
	if f.ID != 0 {
		return IDExistOnSave
	}
	// 先预先设定 Feedback 的 UUID
	FeedbackUUID := uuid.NewV4()
	f.UUID = FeedbackUUID

	feedback, err := f.Save(d.RDB)
	if err != nil {
		return err
	}
	rsp = feedback2Echo(feedback)
	return nil
}
