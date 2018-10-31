// This file "todata.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package dream

import (
//	"github.com/jinzhu/gorm"
)

type Dream interface {
	//	ToData(P *gorm.DB, DataOptions) Dungeons
}

type DataOptions struct {
}

type Dungeons map[string]interface{}
