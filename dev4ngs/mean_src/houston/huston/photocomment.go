package huston

import (
	. "git.ngs.tech/mean/houston/model"

	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"time"
)

// FindPhotoComments 方法: 通过 QueryParameter 协议查询照片下的评论/留言, 查询者和照片所有者必须是好友关系或自身
func (m *MeanController) FindPhotoComments(cu *User, iUUID string, options *QueryParameter) ([]Dungeons, error) {

	eo := &PhotoEchoOption{FetchNote: false, FetchUser: true}

	fPRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUID,
		PhotoEchoOption: eo,
	})
	if err != nil {
		return nil, err
	}
	if fPRsp.Null {
		return nil, PhotoNotFound
	}
	i := fPRsp.Photo
	rTypeRsp, err := Cl.GetRelationType(context.TODO(), &GetRelationRequest{
		FromID: i.User.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}

	if rTypeRsp.UserRelatedType == UserRelatedType_related_type_friend && i.PhotoPrivacy == PhotoPrivacy_photo_privacy_private {
		return nil, InsufficientPermissionsErr
	}

	if rTypeRsp.UserRelatedType == UserRelatedType_related_type_friend || cu.ID == i.User.ID {
		// 注意, 这里我修改了查询方法, 传入图片的 UserUUID
		// 用 comment.UserUUID NOT i.UserUUID 查出 comment
		// 但是这样查询会必然的多传一个 i.UserUUID, 而且有点写死了, 无法应对将来可能的需求变化
		// 我尝试过直接用 Where("reply_to is null") 这样的方式来查询, 不知为何查不出东西.
		// 所以 现在这个能够满足需求, 如果有人觉得多传入一个参数难受的话, 可以帮我解决一下.
		//                                                             Raphael
		cRsp, err := Cl.FindPCWithoutOwner(context.TODO(), &FindPCWithoutOwnerRequest{
			Id:             i.ID,
			UUID:           i.UserUUID,
			QueryParameter: options,
		})
		comments := cRsp.Comments
		if err != nil {
			return nil, err
		}
		replyMap := make(map[string]*Comment)
		var cUUIDs []string
		for i := 0; i < len(comments); i++ {
			replyMap[(comments[i].UUID)] = nil
			cUUIDs = append(cUUIDs, comments[i].UUID)
		}
		rcRsp, err := Cl.FindPhotoReply(context.TODO(), &FindPhotoReplyRequest{
			Id:    i.ID,
			UUIDs: cUUIDs,
		})
		if err != nil {
			return nil, err
		}
		replyComment := rcRsp.Comments
		for _, rc := range replyComment {
			replyMap[rc.ReplyToUUID] = rc
		}
		cs := []Dungeons{}
		for _, c := range comments {
			d, err := CommentToData(c, &CommentDataOption{ReplyToData: replyMap[c.UUID]})
			if err != nil {
				return nil, err
			}
			cs = append(cs, d)
		}
		return cs, nil
	}
	return nil, InsufficientPermissionsErr
}

// CommentOnPhoto 方法: 向指定照片添加评论. iUUID 为照片的 UUID, 动作发送者和照片所有者之间必须是好友关系或是一个人
// 否则权限不够. rUUID 标示本条评论是否回复了另外一条评论.
func (m *MeanController) CommentOnPhoto(cu *User, iUUID, rUUID string, content string, ts time.Time) (Dungeons, error) {

	eo := &PhotoEchoOption{FetchNote: false, FetchUser: true}

	fpRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUID,
		PhotoEchoOption: eo,
	})
	if err != nil {
		return nil, err
	}
	if fpRsp.Null {
		return nil, PhotoNotFound
	}
	i := fpRsp.Photo
	rTypeRsp, err := Cl.GetRelationType(context.TODO(), &GetRelationRequest{
		FromID: i.User.ID,
		ToID:   cu.ID,
	})
	if err != nil {
		return nil, err
	}
	uType := rTypeRsp.UserRelatedType
	if i.PhotoPrivacy != PhotoPrivacy_photo_privacy_public {
		return nil, InsufficientPermissionsErr
	}

	if uType < UserRelatedType_related_type_friend && cu.ID != i.User.ID {
		return nil, InsufficientPermissionsErr
	}

	cRsp, err := Cl.FirstCommentByUser(context.TODO(), &FirstCommentRequest{
		UUID: cu.UUID,
		Id:   i.ID,
	})
	comment := cRsp.Comment
	if err != nil {
		return nil, err
	}
	if !cRsp.Null && cu.UUID == comment.UserUUID {
		return nil, PhotoCommentAlreadyCommentedErr
	}

	if cu.UUID == (i.UserUUID) {
		if rUUID == "" {
			return nil, InsufficientPermissionsErr
		}
		cRsp, err := Cl.FirstCommentByUUID(context.TODO(), &GetByUUIDRequest{
			UUID: rUUID,
		})
		if err != nil {
			return nil, err
		}
		if cRsp.Null {
			return nil, PhotoCommentNotFoundErr
		}
		rc := cRsp.Comment
		if cu.UUID == rc.UserUUID {
			return nil, PhotoCommentAlreadyCommentedErr
		}
		rcRsp, err := Cl.FirstRepliedComment(context.TODO(), &FirstCommentRequest{
			UUID: rUUID,
			Id:   i.ID,
		})
		if err != nil {
			return nil, err
		}
		if !rcRsp.Null {
			return nil, PhotoCommentAlreadyCommentedErr
		}
		comment := &Comment{
			UserUUID:    cu.UUID,
			Type:        CommentType_comment_type_news,
			SourceId:    i.ID,
			Content:     content,
			Timestamp:   ts.Format(time.RFC3339),
			ReplyToUUID: rUUID,
		}
		nCRsp, err := Cl.NewComment(context.TODO(), &PostCommentRequest{
			Comment: comment,
		})
		nc := nCRsp.Comment
		if err != nil {
			return nil, err
		}

		cData, err := CommentToData(nc, &CommentDataOption{ReplyToData: rc})
		if err != nil {
			return nil, err
		}
		return cData, nil

	} else {
		comment := &Comment{
			UserUUID:  cu.UUID,
			Type:      CommentType_comment_type_image,
			SourceId:  i.ID,
			Content:   content,
			Timestamp: ts.Format(time.RFC3339),
		}
		nCRsp, err := Cl.NewComment(context.TODO(), &PostCommentRequest{
			Comment: comment,
		})
		nc := nCRsp.Comment
		if err != nil {
			return nil, err
		}
		cData, err := CommentToData(nc, &CommentDataOption{})
		if err != nil {
			return nil, err
		}
		return cData, nil
	}
}

func (m *MeanController) DeleteImageComment(cu *User, iUUID, cUUID string) (Dungeons, error) {

	eo := &PhotoEchoOption{FetchNote: false, FetchUser: false}
	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUID,
		PhotoEchoOption: eo,
	})
	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	cRsp, err := Cl.FirstCommentByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: cUUID,
	})
	if err != nil {
		return nil, err
	}
	c := cRsp.Comment
	if cRsp.Null {
		return nil, PhotoCommentNotFoundErr
	}

	if c.UserUUID != cu.UUID {
		return nil, InsufficientPermissionsErr
	}

	tStamp := Str2Time(c.Timestamp)
	if tStamp.Add(time.Hour * 24).Before(time.Now()) {
		return nil, DeletePhotoCommentLimitReachErr
	}

	if rUUID := Str2UUID(c.ReplyToUUID); rUUID != uuid.Nil {
		if _, err := Cl.DeleteCommentByUUID(context.TODO(), &GetByUUIDRequest{
			UUID: rUUID.String(),
		}); err != nil {
			return nil, err
		}
	}

	//TODO 是否应该两步并做一步, 将联合删除合并到一起.

	if _, err := Cl.DeleteCommentByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: c.UUID,
	}); err != nil {
		return nil, err
	}

	cData, err := CommentToData(c, &CommentDataOption{LiteData: true})
	if err != nil {
		return nil, err
	}

	return cData, nil
}
