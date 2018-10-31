package phoenix

import (
	"fmt"
	"git.ngs.tech/mean/phoenix/dream"
)

type ErrorType int

const (
	ErrorTypeInternal ErrorType = 1 + iota
	ErrorTypePublic
)

//TODO 错误的代码可能不需要几个 之后可以合并
type PhoenixDefault struct {
	HttpCode  int       `json:"-"`
	ErrorType ErrorType `json:"-"`
	ErrorCode int       `json:"code,omitempty"`
	Message   string    `json:"message,omitempty"`
}

// params model that server return data and message info
type ResultModel struct {
	*PhoenixDefault
	Data interface{} `json:"data,omitempty"`
}

func (p PhoenixDefault) Error() string {
	return fmt.Sprintf("Code: " + string(int(p.ErrorCode)) + ", Message: " + p.Message)
}

func NewPhoenixError(message string, errorCode, httpCode int, errorType ErrorType) *PhoenixDefault {
	return &PhoenixDefault{
		Message:   message,
		ErrorCode: errorCode,
		HttpCode:  httpCode,
		ErrorType: errorType,
	}
}

func NewError(err error) *PhoenixDefault {
	return &PhoenixDefault{
		Message:   err.Error(),
		ErrorCode: 1,
		HttpCode:  500,
		ErrorType: 1,
	}
}

func SuccessResp(content string, data interface{}) dream.Dungeons {
	var d dream.Dungeons
	d[`code`] = 0
	d[`message`] = content
	d[`data`] = data
	return d
}

var (
	RequestParamsErr = NewPhoenixError("Request parameter invalid", 999, 400, ErrorTypePublic)
	ServiceErr       = NewPhoenixError("Servicer error", 500, 500, ErrorTypePublic)
	AuthErr          = NewPhoenixError("Authentication error!", 401, 401, ErrorTypePublic)
)

//account
var (
	UserNotFoundErr       = NewPhoenixError("user not found", 1000, 200, ErrorTypePublic)
	InvalidEmailAdressErr = NewPhoenixError("Invalid Email", 1001, 200, ErrorTypePublic)
	InvalidPhoneNumberErr = NewPhoenixError("Invalid Phone Number", 1002, 200, ErrorTypePublic)
	InvalidUserNameErr    = NewPhoenixError("Invalid User name", 1003, 200, ErrorTypePublic)
	InvalidPasswordErr    = NewPhoenixError("Wrong Password", 1004, 200, ErrorTypePublic)
	NameFormatErr         = NewPhoenixError("name format error", 1005, 200, ErrorTypePublic)
	InvalidSecretCodeErr  = NewPhoenixError("secret code error", 1006, 200, ErrorTypePublic)
	TimestampFormatErr    = NewPhoenixError("time stamp format error", 1007, 200, ErrorTypePublic)
)

//photo
var (
	InvalidPhotoTypeErr             = NewPhoenixError("image type already is", 2000, 403, ErrorTypePublic)
	InvalidPhotoTypeAdjustmentError = NewPhoenixError("image type adjustment invalid", 2001, 403, ErrorTypePublic)
	PhotoTypeErr                    = NewPhoenixError("image type input err", 2003, 403, ErrorTypePublic)
	PhotoNotFound                   = NewPhoenixError("image not found ", 2004, 403, ErrorTypePublic)
)

//Comment
var (
	PhotoCommentNotFoundErr = NewPhoenixError("can't found image comment", 3001, 404, ErrorTypePublic)
)

//auth
var (
	UserNotFound = NewPhoenixError("user not found", 401, 200, ErrorTypePublic)
	LoginErr     = NewPhoenixError("user or pass is not right", 401, 200, ErrorTypePublic)
)

//Admin
var (
	AdminUpdateFailure = NewPhoenixError("update failure ", 5001, 200, ErrorTypePublic)
	AdminDeleteFailure = NewPhoenixError("delete failure", 5002, 200, ErrorTypePublic)
	AdminInit          = NewPhoenixError("Admin data init failure", 5002, 200, ErrorTypePublic)
	AdminGetFailure    = NewPhoenixError("get admin failure", 5003, 200, ErrorTypePublic)
	AdminIdsRequire    = NewPhoenixError("the params without null,ids need !", 5004, 200, ErrorTypePublic)
	AdminUUIDRequire   = NewPhoenixError("the params without null,uuid need !", 5005, 200, ErrorTypePublic)
)

//Menu
var (
	MenuUpdateFailure = NewPhoenixError("update failure ", 6001, 200, ErrorTypePublic)
	MenuDeleteFailure = NewPhoenixError("delete failure", 6002, 200, ErrorTypePublic)
	MenuGetFailure    = NewPhoenixError("get menu failure", 6003, 200, ErrorTypePublic)
	MenuIdsRequire    = NewPhoenixError("the params without null,ids need !", 6004, 200, ErrorTypePublic)
	MenuUUIDRequire   = NewPhoenixError("the params without null,uuid need !", 6005, 200, ErrorTypePublic)
)

//Role
var (
	RoleUpdateFailure = NewPhoenixError("update Role failure ", 7001, 200, ErrorTypePublic)
	RoleDeleteFailure = NewPhoenixError("delete Role failure", 7002, 200, ErrorTypePublic)
	RoleGetFailure    = NewPhoenixError("get Role failure", 7003, 200, ErrorTypePublic)
	RoleIdsRequire    = NewPhoenixError("the params without null,ids need !", 7004, 200, ErrorTypePublic)
	RoleUUIDRequire   = NewPhoenixError("the params without null,uuid need !", 7005, 200, ErrorTypePublic)
)

//Operation
var (
	OperationUpdateFailure = NewPhoenixError("update Operation failure ", 8001, 200, ErrorTypePublic)
	OperationDeleteFailure = NewPhoenixError("delete Operation failure", 8002, 200, ErrorTypePublic)
	OperationGetFailure    = NewPhoenixError("get Operation failure", 8003, 200, ErrorTypePublic)
	OperationIdsRequire    = NewPhoenixError("the params without null,ids need !", 8004, 200, ErrorTypePublic)
	OperationUUIDRequire   = NewPhoenixError("the params without null,uuid need !", 8005, 200, ErrorTypePublic)
)

//Permission
var (
	PermissionUpdateFailure = NewPhoenixError("update Permission failure ", 9001, 200, ErrorTypePublic)
	PermissionDeleteFailure = NewPhoenixError("delete Permission failure", 9002, 200, ErrorTypePublic)
	PermissionGetFailure    = NewPhoenixError("get Permission failure", 9003, 200, ErrorTypePublic)
	PermissionIdsRequire    = NewPhoenixError("the params without null,ids need !", 9004, 200, ErrorTypePublic)
	PermissionUUIDRequire   = NewPhoenixError("the params without null,uuid need !", 9005, 200, ErrorTypePublic)
)
