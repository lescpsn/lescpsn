// This file "errors.go" is created by Lincan Li at 11/20/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package huston

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

//Account
var (
	UserNotFoundErr       = NewMeanError("user not found", 1000, 403, ErrorTypePublic)
	InvalidEmailAdressErr = NewMeanError("Invalid Email", 1001, 403, ErrorTypePublic)
	InvalidPhoneNumberErr = NewMeanError("Invalid Phone Number", 1002, 403, ErrorTypePublic)
	InvalidUserNameErr    = NewMeanError("Invalid User name", 1003, 403, ErrorTypePublic)
	InvalidPasswordErr    = NewMeanError("Wrong Password", 1004, 403, ErrorTypePublic)
	NameFormatErr         = NewMeanError("name format error", 1005, 403, ErrorTypePublic)
	InvalidSecretCodeErr  = NewMeanError("secret code error", 1006, 401, ErrorTypePublic)
	InvalidOpenIDErr      = NewMeanError("Invalid OpenID", 1001, 403, ErrorTypePublic)
)

//Relations
var (
	InvalidRelationActionErr     = NewMeanError("invalid relation action", 2001, 403, ErrorTypePublic)
	DuplicateFriendApplyErr      = NewMeanError("already in friendship", 2002, 403, ErrorTypePublic)
	FriendApplicationNotFoundErr = NewMeanError("not applying friend yet", 2003, 403, ErrorTypePublic)
	NoRelationFoundErr           = NewMeanError("no relation", 2004, 403, ErrorTypePublic)
)

//Photo
var (
	//InvalidPhotoTypeErr    = NewMeanError("image type already is", 3000, 403, ErrorTypePublic)
	//PhotoExistErr          = NewMeanError("image exist", 3001, 403, ErrorTypePublic)
	InvalidPhotoEditParams = NewMeanError("invalid photo params", 3001, 403, ErrorTypePublic)
	PhotoNotFound          = NewMeanError("image not found ", 3002, 403, ErrorTypePublic)
)

//Comment
var (
	PhotoCommentAlreadyCommentedErr = NewMeanError("Photo comment already commented", 4000, 403, ErrorTypePublic)
	PhotoCommentNotFoundErr         = NewMeanError("can't found image comment", 4001, 403, ErrorTypePublic)
	NewsCommentNotFoundErr          = NewMeanError("can't found News comment", 4002, 403, ErrorTypePublic)
	DeletePhotoCommentLimitReachErr = NewMeanError("delete comment time out", 4003, 403, ErrorTypePublic)
)

//Note
var (
	PhotoNoteMustHaveTitleErr = NewMeanError("image note must have title", 5000, 403, ErrorTypePublic)
	NoteExistErr              = NewMeanError("Note aleady exist on image and it's complete", 5001, 400, ErrorTypePublic)
	TooManyPhotoLinkNoteErr   = NewMeanError("note has linked 9 image ", 5002, 403, ErrorTypePublic)
	NoteUpdateTimeOutErr      = NewMeanError("update note time out ", 5003, 403, ErrorTypePublic)
	NoteNotFoundErr           = NewMeanError("note not found", 5005, 400, ErrorTypePublic)
	NoteCharacterErr          = NewMeanError("note character out of limit", 5006, 403, ErrorTypePublic)
)

//News
var (
	TooManyPhotoErr      = NewMeanError("News can't sending with more than 9 image", 6001, 403, ErrorTypePublic)
	PhotoPermissionErr   = NewMeanError("News image type can't be private", 6002, 403, ErrorTypePublic)
	NewsStarrNotFoundErr = NewMeanError("cant found starred record on News", 6003, 400, ErrorTypePublic)
	NewsStarForbidden    = NewMeanError("News can't starred", 6004, 403, ErrorTypePublic)
	NewsNotFoundErr      = NewMeanError("News not found", 6005, 400, ErrorTypePublic)
	NewsPhotoIsNil       = NewMeanError("News images is not found", 6006, 400, ErrorTypeInternal)
)

//Diary
var (
	DiaryNotFoundErr = NewMeanError("Diary not found", 7000, 403, ErrorTypePublic)
)

func NewErrDBFail(err error) *MeanError {
	log.Print(err)
	return NewMeanError("DB Error", -100, 500, ErrorTypeInternal)
}
