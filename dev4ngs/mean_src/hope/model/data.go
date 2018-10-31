package model

import (
	echo "git.ngs.tech/mean/proto"
	"gopkg.in/mgo.v2/bson"
	"time"
)

func Echo2Notice(n echo.Notice) Notice {
	no := Notice{}
	if n.ID != "" {
		no.ID = bson.ObjectIdHex(n.ID)
	}
	no.FromID = n.FromID
	no.ToID = n.ToID
	no.Title = n.Title
	no.Type = n.Type
	no.Content = n.Content
	var err error
	no.Timestamp, err = time.Parse(time.RFC3339, n.Timestamp)
	if err != nil {
		no.Timestamp = time.Time{}
	}
	no.Status = echo.NoticStatus_Unread
	return no
}
