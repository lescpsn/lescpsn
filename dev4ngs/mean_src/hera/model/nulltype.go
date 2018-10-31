// This file "nulltype" is created by Lincan Li at 5/10/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"database/sql"
	"encoding/json"
)

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

func NewValidNullIntType(i int) NullInt {
	return NullInt{sql.NullInt64{Int64: int64(i), Valid: true}}
}

func (i NullInt) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.Int64)
}

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

type NullString struct {
	sql.NullString
}

func NewNullString(s string, v bool) NullString {
	return NullString{sql.NullString{String: s, Valid: v}}
}

func NewValidNullString(s string) NullString {
	return NullString{sql.NullString{String: s, Valid: true}}
}

func (i *NullString) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.String)
}
