// This file "nullstruct.go" is created by Lincan Li at 6/14/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package proto

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
)

// --------- INTEGER TYPE ---------

func (i IntegerType) Ptr() *int64 {
	if !i.Null {
		return nil
	}
	return &i.Int
}

func (i IntegerType) IsZero() bool {
	return !i.Null
}

func (i *IntegerType) GetInt() int64 {
	if i == nil {
		return 0
	}
	return i.Int
}

func Integer(i int64) *IntegerType {
	return &IntegerType{Int: int64(i), Null: false}
}

func (n *IntegerType) Scan(value interface{}) error {
	v := sql.NullInt64{Int64: n.Int, Valid: !n.Null}
	if err := v.Scan(value); err != nil {
		return err
	}

	n.Null = !v.Valid
	n.Int = v.Int64
	return nil
}

func (n *IntegerType) Value() (driver.Value, error) {
	if n == nil {
		return nil, nil
	}
	if n.Null {
		return nil, nil
	}
	return n.Int, nil
}

// JSON Marshal
func (i IntegerType) MarshalJSON() ([]byte, error) {
	if i.Null {
		return []byte("null"), nil
	}
	return []byte(strconv.FormatInt(i.Int, 10)), nil
}

func (i IntegerType) MarshalText() ([]byte, error) {
	if i.Null {
		return []byte{}, nil
	}
	return []byte(strconv.FormatInt(i.Int, 10)), nil
}

// UnmarshalJSON implements json.Unmarshaler.
// It supports number and null input.
// 0 will not be considered a null Int.
func (i *IntegerType) UnmarshalJSON(data []byte) error {
	var err error
	var v interface{}
	if err = json.Unmarshal(data, &v); err != nil {
		return err
	}

	switch v.(type) {
	case float64:
		// Unmarshal again, directly to int64, to avoid intermediate float64
		err = json.Unmarshal(data, &i.Int)
	case nil:
		i.Null = true
		return nil
	default:
		err = fmt.Errorf("json: cannot unmarshal %v into Go value of type null.Int", reflect.TypeOf(v).Name())
	}
	i.Null = err != nil
	return err
}

func (i *IntegerType) UnmarshalText(text []byte) error {
	str := string(text)
	if str == "" || str == "null" {
		i.Null = true
		return nil
	}
	var err error
	i.Int, err = strconv.ParseInt(string(text), 10, 64)
	i.Null = err != nil
	return err
}

// --------- STRING TYPE ---------

func (i StringType) Ptr() *string {
	if !i.Null {
		return nil
	}
	return &i.String_
}

func (i StringType) IsZero() bool {
	return !i.Null
}

func (i *StringType) GetString() string {
	if i == nil {
		return ""
	}
	return i.String_
}

func String(i string) *StringType {
	return &StringType{String_: i, Null: false}
}

func (n *StringType) Scan(value interface{}) error {
	v := sql.NullString{String: n.String_, Valid: !n.Null}
	if err := v.Scan(value); err != nil {
		return err
	}

	n.Null = !v.Valid
	n.String_ = v.String
	return nil
}

func (n *StringType) Value() (driver.Value, error) {
	if n == nil {
		return nil, nil
	}

	if n.Null {
		return nil, nil
	}
	return n.String_, nil
}

// JSON Marshal
func (i StringType) MarshalJSON() ([]byte, error) {
	if i.Null {
		return []byte("null"), nil
	}
	return json.Marshal(i.String_)
}

func (i StringType) MarshalText() ([]byte, error) {
	if i.Null {
		return []byte{}, nil
	}
	return []byte(i.String_), nil
}

// UnmarshalJSON implements json.Unmarshaler.
// It supports number and null input.
// 0 will not be considered a null Int.
func (s *StringType) UnmarshalJSON(data []byte) error {
	var err error
	var v interface{}
	if err = json.Unmarshal(data, &v); err != nil {
		return err
	}
	switch x := v.(type) {
	case string:
		s.String_ = x
	case nil:
		s.Null = true
		return nil
	default:
		err = fmt.Errorf("json: cannot unmarshal %v into Go value of type null.String", reflect.TypeOf(v).Name())
	}
	s.Null = err != nil
	return err
}

// --------- BOOL TYPE ---------

func (i BooleanType) Ptr() *bool {
	if !i.Null {
		return nil
	}
	return &i.Bool
}

func (i BooleanType) IsZero() bool {
	return !i.Null
}

func Boolean(b bool) *BooleanType {
	return &BooleanType{Bool: b, Null: false}
}

func (n *BooleanType) Scan(value interface{}) error {
	v := sql.NullBool{Bool: n.Bool, Valid: !n.Null}
	if err := v.Scan(value); err != nil {
		return err
	}

	n.Null = !v.Valid
	n.Bool = v.Bool
	return nil
}

func (n *BooleanType) Value() (driver.Value, error) {
	if n == nil {
		return nil, nil
	}
	if n.Null {
		return nil, nil
	}
	return n.Bool, nil
}

func (n *BooleanType) GetBool() bool {
	if n == nil {
		return false
	}
	return n.Bool
}

// JSON Marshal
func (b BooleanType) MarshalJSON() ([]byte, error) {
	if b.Null {
		return []byte("null"), nil
	}
	if !b.Bool {
		return []byte("false"), nil
	}
	return []byte("true"), nil
}

func (b BooleanType) MarshalText() ([]byte, error) {
	if b.Null {
		return []byte{}, nil
	}
	if !b.Bool {
		return []byte("false"), nil
	}
	return []byte("true"), nil
}

// UnmarshalJSON implements json.Unmarshaler.
// It supports number and null input.
// 0 will not be considered a null Int.
func (b *BooleanType) UnmarshalJSON(data []byte) error {
	var err error
	var v interface{}
	if err = json.Unmarshal(data, &v); err != nil {
		return err
	}
	switch x := v.(type) {
	case bool:
		b.Bool = x
	case nil:
		b.Null = true
		return nil
	default:
		err = fmt.Errorf("json: cannot unmarshal %v into Go value of type null.Bool", reflect.TypeOf(v).Name())
	}
	b.Null = err != nil
	return err
}

func (b *BooleanType) UnmarshalText(text []byte) error {
	str := string(text)
	switch str {
	case "", "null":
		b.Null = true

		return nil
	case "true":
		b.Bool = true
	case "false":
		b.Bool = false
	default:
		b.Null = true
		return fmt.Errorf("invalid input:" + str)
	}
	b.Null = false
	return nil
}
