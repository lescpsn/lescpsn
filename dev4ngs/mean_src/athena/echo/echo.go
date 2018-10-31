// This file "echo.go" is created by Lincan Li at 5/9/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
)

const DocIndexName = "news"

type Athena struct {
	MDB    *mgo.Database
	DIndex string
}

const MDB_CONTEXT = "MDB_CTX"

func (a *Athena) Context(ctx context.Context) {
	if ctx == nil {
		return
	}
	v := ctx.Value(MDB_CONTEXT).(*mgo.Database)

	a.MDB = v
	a.DIndex = DocIndexName
}
