// This file "errors.go" is created by Lincan Li at 6/17/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package mars

import "log"

type SMSError struct {
	Code    int
	Message string
}

func (s SMSError) Error() string {
	log.Println(s.Message)
	return s.Message
}

func NewError(code int, message string) *SMSError {
	return &SMSError{code, message}
}

var (
	InvalidHistoryInput = NewError(1000, "Invalid input history, items missing")
)
