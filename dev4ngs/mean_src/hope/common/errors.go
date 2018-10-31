// This file "errors.go" is created by Lincan Li at 11/20/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package common

import (
	"fmt"
	"log"
)

type ErrorType int

const (
	ErrorTypeInternal ErrorType = 1 + iota
	ErrorTypePublic
)

type MeanError struct {
	HttpCode  int       `json:"-"`
	ErrorType ErrorType `json:"-"`

	ErrorCode int    `json:"code"`
	Message   string `json:"message"`
}

func (p MeanError) Error() string {
	return fmt.Sprintf("Code: " + string(int(p.ErrorCode)) + ", Message: " + p.Message)
}

func NewMeanError(message string, errorCode, httpCode int, errorType ErrorType) *MeanError {
	return &MeanError{
		Message:   message,
		ErrorCode: errorCode,
		HttpCode:  httpCode,
		ErrorType: errorType,
	}
}

var (
	JsonConversionErrorErr = NewMeanError("json conversino fail", 2, 500, ErrorTypePublic)
)

var (
	ServerErr                  = NewMeanError("ServerErr", -1, 500, ErrorTypeInternal)
	RequestParamsErr           = NewMeanError("Request parameter invalid", 999, 400, ErrorTypePublic)
	StringConversionErr        = NewMeanError("string conversion invalid", 999, 400, ErrorTypePublic)
	AuthErr                    = NewMeanError("Un Auth Access", 1, 401, ErrorTypePublic)
	InsufficientPermissionsErr = NewMeanError("Insufficient permissions", 2, 403, ErrorTypePublic)
	DeviceErr                  = NewMeanError("Device Token Error", 3, 401, ErrorTypePublic)
)

//Diary
var (
	DiaryNotFoundErr = NewMeanError("Diary not found", 7000, 403, ErrorTypePublic)
)

func NewErrDBFail(err error) *MeanError {
	log.Print(err)
	return NewMeanError("DB Error", -100, 500, ErrorTypeInternal)
}
