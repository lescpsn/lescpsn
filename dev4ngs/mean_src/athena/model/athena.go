package model

import ()

type Athena struct {
	PushFeed func(int64) (int32, int64, error)
}

var ACenter Athena
