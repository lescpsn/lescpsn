// This file "echo.go" is created by Lincan Li at 5/9/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/config"
	"github.com/jinzhu/gorm"
	"golang.org/x/net/context"
)

type Dream struct {
	RDB    *gorm.DB
	DIndex string
}

const RDB_CONTEXT = "RDB_CTX"

func (d *Dream) Context(ctx context.Context) {
	if ctx == nil {
		return
	}
	v := ctx.Value(RDB_CONTEXT).(*gorm.DB)

	d.RDB = v
	d.DIndex = config.DocIndexName
}
