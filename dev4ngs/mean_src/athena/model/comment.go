// This file "comment.go" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import dream "git.ngs.tech/mean/proto"

type CommentDataOption struct {
	LiteData        bool
	ReplyToData     *dream.Comment
	ReplyToLiteData bool
}

func CommentToData(c *dream.Comment, o *CommentDataOption) (Dungeons, error) {
	var err error

	d := make(Dungeons)
	d[`id`] = c.ID
	d[`uuid`] = c.UUID
	d[`content`] = c.Content
	d[`timestamp`] = c.Timestamp
	if c.User != nil {
		uData, err := UserToData(c.User, &UserDataOption{})
		if err != nil {
			return nil, err
		}
		d[`user`] = uData
	}
	if err != nil {
		return nil, err
	}
	if o.LiteData {
		return d, nil
	}
	if o.ReplyToData != nil {
		var err error
		d[`reply`], err = CommentToData(o.ReplyToData, &CommentDataOption{LiteData: o.ReplyToLiteData})
		if err != nil {
			return nil, err
		}
	}
	return d, nil
}
