package echo

import (
	"git.ngs.tech/mean/athena/model"
	. "git.ngs.tech/mean/proto"
	"time"
)

func Time2Str(t time.Time) string {
	if t == (time.Time{}) || t.IsZero() {
		return ""
	}

	ts := t.Format(time.RFC3339)
	return ts
}

func news2echo(n *model.News) *News {
	return &News{
		ID:           n.ID,
		UUID:         n.UUID,
		CreatedAt:    Time2Str(n.CreatedAt),
		UpdatedAt:    Time2Str(n.UpdatedAt),
		DeletedAt:    Time2Str(n.DeletedAt),

		UserID:       n.UserID,
		PhotoIDs:     n.PhotoIDs,

		PhotoCount:   int64(n.PhotoCount),
		CommentCount: int64(n.CommentCount),
		StarredCount: int64(n.StarredCount),
		Timestamp:    Time2Str(n.Timestamp),
		Photos:        n.Photos,
		User:          n.User,

	}
}

func newss2echo(ns []*model.News) []*News {
	var fEchos []*News
	for _, n := range ns {
		fEchos = append(fEchos, news2echo(n))
	}
	return fEchos
}
