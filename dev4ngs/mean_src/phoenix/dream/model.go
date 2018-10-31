// This file "mdel.go" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package dream

import (
	"database/sql"
	"encoding/json"
	"github.com/satori/go.uuid"
	"time"
)

// Model something
type Model struct {
	ID        int64      `gorm:"primary_key" json:"id,omitempty"`
	CreatedAt time.Time  `json:"-"`
	UpdatedAt time.Time  `json:"-"`
	DeletedAt *time.Time `sql:"index" json:"-"`
	UUID      uuid.UUID  `sql:"type:uuid;default:uuid_generate_v4()" json:"uuid,omitempty"`
}

// QueryParameter struct, used to serve as an options object
// when calling "find" action, SinceID is the smallest id user
// wish to retrieve and the MaxID is the largest one, Page
// and count correspond a "pagination" where Page indicate which
// page user which to have and count means the number of items
// in single page. In addition, when Count appear and Page not,
// the Count parameter simply indicate the limit of query.
type QueryParameter struct {
	SinceID int
	MaxID   int
	Page    int
	Count   int
}

type AdminQueryParameter struct {
	CurrentPage int
	Count       int
	UserId      int64
	Sort        string
	SinceAt     string
	MaxAt       string
	Status      int
}

////////////////////////////////////////

type NullInt struct {
	sql.NullInt64
}

func NewNullInt32(i int32, v bool) NullInt {
	return NullInt{sql.NullInt64{Int64: int64(i), Valid: v}}
}

func NewNullInt(i int64, v bool) NullInt {
	return NullInt{sql.NullInt64{Int64: int64(i), Valid: v}}
}

func NewValidNullInt(i int64) NullInt {
	return NullInt{sql.NullInt64{Int64: int64(i), Valid: true}}
}

func (i NullInt) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.Int64)
}

////////////////////////////////////////

type NullFloat struct {
	sql.NullFloat64
}

func NewNullFloat32(i float32) NullFloat {
	return NullFloat{sql.NullFloat64{Float64: float64(i), Valid: i != 0}}
}

func NewNullFloat64(i float64) NullFloat {
	return NullFloat{sql.NullFloat64{Float64: float64(i), Valid: i != 0}}
}

func (n NullFloat) MarshalJSON() ([]byte, error) {
	return json.Marshal(n.Float64)
}

////////////////////////////////////////

type NullBool struct {
	sql.NullBool
}

func NewNullBool(b bool, v bool) NullBool {
	return NullBool{sql.NullBool{Bool: b, Valid: v}}
}

func NewValidNullBool(b bool) NullBool {
	return NullBool{sql.NullBool{Bool: b, Valid: true}}
}

func (i *NullBool) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.Bool)
}
