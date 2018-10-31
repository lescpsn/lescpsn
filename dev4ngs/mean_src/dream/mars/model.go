// This file "mdel.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	"github.com/satori/go.uuid"
	"time"
)

// Model something
type Model struct {
	ID        int64      `gorm:"primary_key" json:"id,omitempty"`
	UUID      uuid.UUID  `sql:"type:uuid;default:uuid_generate_v4()" json:"uuid,omitempty"`
	CreatedAt time.Time  `json:"-"`
	UpdatedAt time.Time  `json:"-"`
	DeletedAt *time.Time `sql:"index" json:"-"`
}

////分页数据
//type PageModel struct {
//	PageSize   int
//	TotalCount int64
//	PageIndex  int
//	Data       interface{}
//}
