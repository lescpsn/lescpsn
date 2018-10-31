// This file "super.go" is created by Lincan Li at 5/17/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (d Dream) CreateSchema(ctx context.Context, req *Empty, rsp *Empty) error {
	d.Context(ctx)
	mars.SetUpRDB(d.RDB)
	return nil
}

func (d Dream) TearDownSchema(ctx context.Context, req *Empty, rsp *Empty) error {
	d.Context(ctx)
	mars.TearDownRDB(d.RDB)
	return nil
}
