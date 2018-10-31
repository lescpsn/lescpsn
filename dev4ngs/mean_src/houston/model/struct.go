// This file "struct" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"gopkg.in/mgo.v2/bson"
)

type Location struct {
	Country  string `json:"country"`
	State    string `json:"state"`
	City     string `json:"city"`
	District string `json:"district"`
}

type AccountDynamics struct {
	ID           bson.ObjectId  `json:"id,omitempty" bson:"_id,omitempty"`
	UserUUID     string         `json:"user_uuid" bson:"user_uuid"`
	UserRelation Dungeons       `json:"user_rel" bson:"user_rel"`
	DymsStatus   DynamicsStatus `json:"dyms_status" bson:"dyms_status"`
	Title        string         `json:"title,omitempty" bson:"title,omitempty"`
	Type         string         `json:"type,omitempty" bson:"type,omitempty"`
	Mark         string         `json:"mark,omitempty" bson:"mark,omitempty"`
	Timestamp    string         `bson:"timestamp,omitempty"`
}

type Activity struct {
	ID        bson.ObjectId `json:"id,omitempty" bson:"_id,omitempty"`
	ImgURL    string        `json:"img_url" bson:"img_url"`
	ToURL     string        `json:"to_url" bson:"to_url"`
	Title     string        `json:"title,omitempty" bson:"title,omitempty"`
	Mark      string        `json:"mark,omitempty" bson:"mark,omitempty"`
	Timestamp string        `bson:"timestamp,omitempty"`
}

type DynamicsStatus int

const (
	DynamicsStatusRead DynamicsStatus = 1 + iota
	DynamicsStatusUnread
)
