// This file "errors" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

type DreamError struct {
	Message string
	Dream   *Dream
}

func (d DreamError) Error() string {
	return d.Message
}

func BuildDreamError(message string) *DreamError {
	return &DreamError{Message: message}
}

var (
	IDExistOnSave  *DreamError = BuildDreamError("IDExistOnSave")
	EntityNotFound             = BuildDreamError("EntityNotFound")
)
