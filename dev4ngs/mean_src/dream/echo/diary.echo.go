// This file "photoresponse" is created by Lincan Li at 6/15/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
)

func echo2diary(ed *Diary) *mars.DB_Diary {
	return &mars.DB_Diary{
		Model: mars.Model{
			ID:   ed.ID,
			UUID: Str2UUID(ed.UUID),
		},
		UserUUID:     Str2UUID(ed.UserUUID),
		Title:        ed.Title,
		Content:      ed.Content,
		Style:        ed.Style,
		DiaryPrivacy: ed.DiaryPrivacy,
		DiaryStatus:  ed.DiaryStatus,
		Timestamp:    Str2Time(ed.Timestamp),
	}
}

func diary2echo(d *mars.DB_Diary) *Diary {
	return &Diary{
		ID:           d.ID,
		DiaryPrivacy: d.DiaryPrivacy,
		DiaryStatus:  d.DiaryStatus,
		UUID:         d.UUID.String(),
		CreatedAt:    Time2Str(d.CreatedAt),
		UserUUID:     d.UserUUID.String(),
		Title:        d.Title,
		Content:      d.Content,
		Style:        d.Style,
		Timestamp:    Time2Str(d.Timestamp),
	}
}

func diaries2echo(diaries []*mars.DB_Diary) []*Diary {
	var fEchos []*Diary
	for _, diary := range diaries {
		fEchos = append(fEchos, diary2echo(diary))
	}
	return fEchos
}
