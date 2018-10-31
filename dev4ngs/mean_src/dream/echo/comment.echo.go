package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
)

func echo2comment(eComment *Comment) *mars.DB_Comment {
	return &mars.DB_Comment{
		Model: mars.Model{
			ID:   eComment.ID,
			UUID: Str2UUID(eComment.UUID),
		},
		UserUUID:    Str2UUID(eComment.UserUUID),
		ReplyToUUID: Str2UUID(eComment.ReplyToUUID),
		Type:        eComment.Type,
		SourceId:    eComment.SourceId,
		Content:     eComment.Content,
		Timestamp:   Str2Time(eComment.Timestamp),
	}
}

func comment2echo(comment *mars.DB_Comment) *Comment {
	if comment == nil || *comment == (mars.DB_Comment{}) {
		return nil
	}
	cEcho := &Comment{
		ID:        comment.ID,
		UUID:      comment.UUID.String(),
		UserUUID:  comment.UserUUID.String(),
		SourceId:  comment.SourceId,
		Content:   comment.Content,
		Type:      comment.Type,
		Timestamp: Time2Str(comment.Timestamp),
	}
	if usr := comment.User; usr != nil {
		cEcho.User = user2echo(usr)
	}
	if replyTo := comment.ReplyTo; replyTo != nil {
		cEcho.ReplyTo = &Comment{
			ID:        replyTo.ID,
			UserUUID:  replyTo.UserUUID.String(),
			UUID:      replyTo.UUID.String(),
			Content:   replyTo.Content,
			Timestamp: Time2Str(replyTo.Timestamp),
		}
		cEcho.ReplyToUUID = replyTo.UUID.String()
		if user := replyTo.User; user != nil {
			cEcho.ReplyTo.User = user2echo(user)
		}
	}
	return cEcho
}

func comments2echo(comments []*mars.DB_Comment) []*Comment {
	var cEchos []*Comment
	for _, photo := range comments {
		cEchos = append(cEchos, comment2echo(photo))
	}
	return cEchos
}
