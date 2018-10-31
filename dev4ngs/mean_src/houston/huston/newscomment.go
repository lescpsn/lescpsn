package huston

//
//import (
//	. "git.ngs.tech/mean/houston/model"
//	"github.com/satori/go.uuid"
//	"golang.org/x/net/context"
//	. "git.ngs.tech/mean/proto"
//	"time"
//)
//
//func (m *MeanController) NewsNewsComment(cu *User, tUUID, rcUUID string, content string, timestamp time.Time) (Dungeons, error) {
//
//	gNRsp, err := Cl.GetNewsByUUID(context.TODO(), &GetByUUIDRequest{
//		UUID: tUUID,
//	})
//	if err != nil {
//		return nil, err
//	}
//	if gNRsp.Null {
//		return nil, NewsNotFoundErr
//	}
//	tu := gNRsp.News
//	comment := &Comment{
//		UserUUID:  cu.UUID,
//		Type:      CommentType_comment_type_news,
//		SourceId:  tu.ID,
//		Content:   content,
//		Timestamp: timestamp.Format(time.RFC3339),
//	}
//	if Str2UUID(rcUUID) != uuid.Nil {
//		cRsp, err := Cl.FirstCommentByUUID(context.TODO(), &GetByUUIDRequest{
//			UUID: rcUUID,
//		})
//		if err != nil {
//			return nil, err
//		}
//		if cRsp.Null {
//			return nil, NewsCommentNotFoundErr
//		}
//		replyTo := cRsp.Comment
//
//		comment.ReplyToUUID = replyTo.UUID
//	}
//	ncRsp, err := Cl.NewComment(context.TODO(), &PostCommentRequest{
//		Comment: comment,
//	})
//	c := ncRsp.Comment
//	if err != nil {
//		return nil, err
//	}
//	cData, err := CommentToData(c, &CommentDataOption{})
//	if err != nil {
//		return nil, err
//	}
//	return cData, nil
//}
//
//func (m *MeanController) NewsDeleteComment(cu *User, tUUID, cUUID string) (Dungeons, error) {
//
//	gNRsp, err := Cl.GetNewsByUUID(context.TODO(), &GetByUUIDRequest{
//		UUID: tUUID,
//	})
//	if err != nil {
//		return nil, err
//	}
//	if gNRsp.Null {
//		return nil, NewsNotFoundErr
//	}
//	t := gNRsp.News
//
//	cRsp, err := Cl.FirstCommentByUUID(context.TODO(), &GetByUUIDRequest{
//		UUID: cUUID,
//	})
//	if err != nil {
//		return nil, err
//	}
//	if cRsp.Null {
//		return nil, NewsCommentNotFoundErr
//	}
//	c := cRsp.Comment
//
//	if c.UserUUID != cu.UUID && cu.UUID != t.User.UUID {
//		return nil, InsufficientPermissionsErr
//	}
//
//	if _, err := Cl.DeleteCommentByUUID(context.TODO(), &GetByUUIDRequest{
//		UUID: c.UUID,
//	}); err != nil {
//		return nil, err
//	}
//
//	cData, err := CommentToData(c, &CommentDataOption{})
//	if err != nil {
//		return nil, err
//	}
//
//	return cData, nil
//}
//
//func (m *MeanController) FindNewsComments(cu *User, tUUID uuid.UUID, options *QueryParameter) (Dungeons, error) {
//
//	gNRsp, err := Cl.GetNewsByUUID(context.TODO(), &GetByUUIDRequest{
//		UUID: tUUID.String(),
//	})
//	if err != nil {
//		return nil, err
//	}
//	if gNRsp.Null {
//		return nil, NewsNotFoundErr
//	}
//	t := gNRsp.News
//	fCRsp, err := Cl.FindNewsCommentsByID(context.TODO(), &FindByIDWithQPRequest{
//		ID:             t.ID,
//		QueryParameter: options,
//	})
//	comments := fCRsp.Comments
//	if comments == nil {
//		return nil, NewsCommentNotFoundErr
//	}
//	if err != nil {
//		return nil, err
//	}
//	if err != nil {
//		return nil, err
//	}
//	cs := []Dungeons{}
//	d := make(Dungeons)
//	for _, c := range comments {
//		data, err := CommentToData(c, &CommentDataOption{})
//		if err != nil {
//			return nil, err
//		}
//		cs = append(cs, data)
//	}
//	d[`comment_count`] = t.CommentCount
//	d[`comments`] = cs
//	return d, nil
//}
