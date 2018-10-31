package model

import (
	dream "git.ngs.tech/mean/proto"
)

func FeedbackToData(fb *dream.Feedback) (d Dungeons, err error) {
	d = make(Dungeons)
	d[`id`] = fb.ID
	d[`uuid`] = fb.UUID
	d[`create_at`] = fb.CreatedAt
	d[`content`] = fb.Suggest
	d[`u_uuid`] = fb.UserUUID
	d[`connect_info`] = fb.ConnectInfo
	if fb.User != nil {
		uData, err := UserToData(fb.User, &UserDataOption{})
		if err != nil {
			return nil, err
		}
		d[`user`] = uData
	}
	return d, nil
}
