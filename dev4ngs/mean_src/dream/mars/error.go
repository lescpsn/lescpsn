// This file "error" is created by Lincan Li at 1/25/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import (
	"fmt"
	"log"
)

type Error struct {
	Code    int
	Message string
}

func (e Error) Error() string {
	return fmt.Sprintf("")
}

func NewXFailError(e error) *Error {
	log.Print(e)
	return &Error{Code: 2, Message: "Database fail"}
}

func StringConversionFail(s string) *Error {
	return nil
}

func PhotoAlreadyOrigin() *Error {
	return nil
}

func UsernameFromatError() *Error {
	return nil
}

var (
	NewsPhotoIsNil = &Error{Code: -101}
)
