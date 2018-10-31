package model

import (
	"git.ngs.tech/mean/proto"
	"gopkg.in/mgo.v2"
)
func NewsToData(mdb *mgo.Database, news *proto.News) (Dungeons, error) {
	var err error
	d := make(Dungeons)
	d[`id`] = news.ID
	d[`uuid`] = news.UUID
	d[`photo_count`] = len(news.Photos)
	d[`comment_count`] = news.CommentCount
	d[`starred_count`] = news.StarredCount
	d[`timestamp`] = news.Timestamp
	if news.User!= nil {
		d[`user`], err = UserToData(mdb, news.User, &UserDataOption{FillSensitive: true})
		if err != nil {
			return nil, err
		}
	}
	var pd []Dungeons
	for _, v := range news.Photos {
		d, err := PhotoToData(mdb, v, &PhotoDataOption{FillSensitive: false})
		if err != nil {
			continue
		}
		pd = append(pd, d)
	}
	if pd==nil {
		pd=make([]Dungeons,0)
	}

	d[`images`] = pd
	return d, nil
}
