package wand

import "fmt"

type AthenaError struct {
	HttpCode  int    `json:"-"`
	ErrorCode int    `json:"code"`
	Message   string `json:"message"`
}

func NewAthenaError(message string, errorCode, httpCode int) *AthenaError {
	return &AthenaError{
		Message:   message,
		ErrorCode: errorCode,
		HttpCode:  httpCode,
	}
}

func (p AthenaError) Error() string {
	return fmt.Sprintf("Code: " + string(int(p.ErrorCode)) + ", Message: " + p.Message)
}

var (
	ServerErr                  = NewAthenaError("ServerErr", -1, 500)
	RequestParamsErr           = NewAthenaError("Request parameter invalid", 999, 400)
	StringConversionErr        = NewAthenaError("string conversion invalid", 999, 400)
	AuthErr                    = NewAthenaError("Un Auth Access", 1, 401)
	InsufficientPermissionsErr = NewAthenaError("Insufficient permissions", 2, 403)
	DeviceErr                  = NewAthenaError("Device Token Error", 3, 401)
	UserNotFoundErr            = NewAthenaError("user not found", 1000, 403)
)

//NEWS
var (
	TooManyPhotoErr        = NewAthenaError("News can't sending with more than 9 image", 6001, 403)
	NotEnoughPhotoErr      = NewAthenaError("not enough photos", 6001, 403)
	PhotoPermissionErr     = NewAthenaError("News image type can't be private", 6002, 403)
	NewsStarrNotFoundErr   = NewAthenaError("cant found starred record on News", 6003, 400)
	NewsStarForbidden      = NewAthenaError("News can't starred", 6004, 403)
	NewsNotFoundErr        = NewAthenaError("News not found", 6005, 400)
	NewsPhotoIsNil         = NewAthenaError("News images is not found", 6006, 400)
	NewsCommentNotFoundErr = NewAthenaError("can't found News comment", 4002, 403)
)
