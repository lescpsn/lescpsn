package huston

import (
	"git.ngs.tech/mean/houston/config"
	dream "git.ngs.tech/mean/proto"
	"github.com/brandfolder/gin-gorelic"
	"github.com/gin-gonic/gin"
	"github.com/micro/go-micro/broker"
	"strconv"
)

const (
	GroupRouteBodyError   = `/vbr`
	GroupRouteVersion1Key = `/v1`
)

type MeanErrorHandleType int

const (
	MeanErrorHandleTypeHeader MeanErrorHandleType = 1 + iota
	MeanErrorHandelTypeBody
)

const (
	MeanControllerKey  = "MeanControllerKey"
	MeanErrorHandelKey = "MeanReturnErrInBodyKey"
)

const (
	GenericsSuccessCode = 200
	GenericsErrorCode   = 400
)

// account
const (
	InviteCodeRoute         = `account/invite/:invite_code`       // GET
	ClaimInviteCodeRoute    = `account/invites/claim`             // PUT
	LoginRoute              = `account/login`                     // POST
	VerifyUsernameRoute     = `account/verify_username/:username` // GET
	RegisterRoute           = `account/register`                  // POST
	SendRegisterSMSRoute    = `account/mobile/sms`                // POST
	ValidateSMSCodeRoute    = `account/mobile/validate`           // POST
	MobileRegisterRoute     = `account/mobile/register`           // POST
	ForgetPassRoute         = `account/forgetpass`                // POST
	UpdatePassValidateRoute = `account/updatepass/validate`       // PUT
	UpdatePassByCodeRoute   = `account/updatepass/code`           // PUT
)

const (
	CreateSchemaRoute = `createschema`
	ReachabilityRoute = `reachability` // GET
)

// user
const (
	GetUserRoute             = `user/:UUIDString`                    // GET
	UpdateUserRoute          = `user/:UUIDString`                    // PUT
	UpdateMobileRoute        = `user/:UUIDString/mobile`             // PUT
	UpdateEmailRoute         = `user/:UUIDString/email`              // PUT
	RequestNewPasswordRoute  = `user/:UUIDString/password/sms`       // POST
	ValidateNewPasswordRoute = `user/:UUIDString/password/validate`  // POST
	UpdatePasswordRoute      = `user/:UUIDString/password`           // PUT
	FollowRoute              = `user/:UUIDString/follow`             // PUT
	UnFollowRoute            = `user/:UUIDString/unfollow`           // PUT
	RequestFriendRoute       = `user/:UUIDString/request`            // PUT
	RejectApplyFriendRoute   = `users/reject`                        // PUT
	AcceptApplyFriendRoute   = `users/accept`                        // PUT
	EndFriendshipRoute       = `user/:UUIDString/end_friend/:follow` // PUT
	RemarkFriendsRoute       = `user/:UUIDString/remark/:remark`     // PUT
	GetFriendsRoute          = `users/friend`                        // GET
	GetFollowerRoute         = `users/follower`                      // GET
	GetFolloweeRoute         = `users/followee`                      // GET
	GetUsersByNickNameRoute  = `users/search/nickname`               // GET
	GetUsersByTusoIDRoute    = `users/data/:tusoID`                  // GET
	SearchUserByKeywords     = `users/query/:Keywords`               // GET
	DeleteAngelRoute         = `account/delete/:phone_number`        // GET
	AddFriendForTest         = `relation/add_friend`                 // PUT
	AddFollowForTest         = `relation/add_follow`                 // PUT
)

// photo
const (
	ImageUploadrRoute  = `photo_callback`  // POST
	AvatarUploadrRoute = `avatar_callback` // POST

	RequestTokenRoute         = `photo_token/:curl` // GET
	RequestTokenNonTrailRoute = `photo_token`       // GET
	RequestAvatarTokenRoute   = `avatar_token`      // GET
	ImageUniqueRoute          = `photo_unique`      // GET

	GetAvatarsRoute         = `user/:UUIDString/avatar`                // GET
	UpdatePhotoRoute        = `photo/:UUIDString`                      // PUT
	PhotoPipelineRoute      = `photo_pipeline`                         // POST
	UploadAvatarRoute       = `photos/avatar`                          // POST
	GetImageDataRoute       = `photo/:UUIDString/data`                 // GET
	PublicImageRoute        = `photo/:UUIDString/public`               // PUT
	PrivateImageRoute       = `photo/:UUIDString/private`              // PUT
	UploadNoteRoute         = `photo/:UUIDString/note`                 // POST
	DeleteImageRoute        = `photo/:UUIDString/delete`               // DELETE
	PublicImagesRoute       = `photos/public`                          // PUT
	PrivateImagesRoute      = `photos/private`                         // PUT
	DeleteImagesRoute       = `photos/delete`                          // DELETE
	UpdateNoteRoute         = `note/:UUIDString`                       // PUT
	GetImagesRoute          = `user/:UUIDString/photos`                // GET
	CommentOnImageRoute     = `photo/:UUIDString/comment`              // POST
	GetImageCommentRoute    = `photo/:UUIDString/comments`             // GET
	DeleteImageCommentRoute = `photo/:UUIDString/comment/:CUUIDString` // DELETE
)

//Message
const (
	GetMessageRoute = `message/messages` // GET
)

// Suggestion
const (
	FeedbackRoute = `feedback/` // GET POST
)

const (
	GetJsTicketRoute = `wechat/js_ticket/:urlBase64`
)

// Fake QiNiu
const (
	FakeQiNiuRoute = `fake/qiniu` //POST
)

//For Test
const (
	CreatePhotoRoute = `photos/create` //POST
)

//Diary
const (
	NewDiaryRoute                   = `diary`                         //POST
	UpdateDiaryByIDRoute            = `diary/item/:ID`                //PUT
	PatchDiaryByIDRoute             = `diary/patch/:ID`               //PUT
	PatchDiaryPrivacyByIDRoute      = `diary/patch/:ID/:DiaryPrivacy` //PUT
	DeleteDiaryByIDRoute            = `diary/id/:ID`                  //DELETE
	DeleteDiaryByUUIDRoute          = `diary/uuid/:UUID`              //DELETE
	FindDiaryByUserIDRoute          = `diary/usrid/:ID`               //GET
	FindDiaryByUserUUIDRoute        = `diary/usruuid/:UUID`           //GET
	FindAllDiaryByUserIDRoute       = `diary/all/usrid/:ID`           //GET
	FindAllDiaryByUserUUIDRoute     = `diary/all/usruuid/:UUID`       //GET
	GetDiaryByIDRoute               = `diary/id/:ID`                  //GET
	GetDiaryByIDsRoute              = `diary/ids`                     //POST
	GetDiaryByUUIDRoute             = `diary/uuid/:UUID`              //GET
	GetDiaryByUUIDsRoute            = `diary/uuids`                   //POST
	GetDiaryMixPhotoByUserUUIDRoute = `diarymixphoto/:UUID`           //GET
	//InsertDiaryMixPhoto = `diarymixphoto/insert`       //post test mongodb
	//ListDiaryMixPhoto = `diarymixphoto/list`           //get test mongodb
)

//AccountDynamics
const (
	NewAccountDynamicsRoute            = `account_dyms/`              //POST
	UpdateAccountDynamicsByIDRoute     = `account_dyms/read/:ID`      //PUT
	DeleteAccountDynamicsByIDRoute     = `account_dyms/:ID`           //DELETE
	FindAccountDynamicsByUserUUIDRoute = `account_dyms/usruuid/:UUID` //GET
	GetAccountDynamicsByIDRoute        = `account_dyms/item/:ID`      //GET

)

//Activity
const (
	NewActivityRoute        = `activity/`    //POST
	UpdateActivityByIDRoute = `activity/:ID` //PUT
	DeleteActivityByIDRoute = `activity/:ID` //DELETE
	FindActivityRoute       = `activity/`    //GET
	GetActivityByIDRoute    = `activity/:ID` //GET

)

var defaultBroker broker.Broker

type Mean struct {
	Config *config.HustonConfig
	Route  *gin.Engine
}

func (m Mean) Engine() *gin.Engine {
	m.Route = gin.New()

	// Global middleware
	m.Route.Use(gin.Logger())
	//m.Route.Use(LoggerWithWriter())
	m.Route.Use(gin.Recovery())

	// new relic monitor
	gorelic.InitNewrelicAgent("f243fdc54ca4b221bbabef85444e798a6d946335", "Huston", false)
	m.Route.Use(gorelic.Handler)
	defaultBroker = NewBroker()
	m.Route.Use(InitHandler(m.Config))
	m.Route.Use(ErrorDBTransactionHandler())
	m.Route.Use(HeaderErrorHandler())

	br := m.Route.Group(GroupRouteBodyError)
	{
		br.Use(BodyErrorHandler())
		WrapUploadrRoutes(br)
	}

	v1 := m.Route.Group(GroupRouteVersion1Key)
	{
		WrapAccountRoutes(v1)
		v1.Use(AuthorizationHandler())
		WrapImageRoutes(v1)
		WrapUserRoutes(v1)
		WrapDiaryRoutes(v1)
		WrapAccountDynamicsRoutes(v1)
		WrapFeedbackRoutes(v1)
		WrapDiaryMixPhotoRoutes(v1)
		WrapActivityRoutes(v1)
	}

	return m.Route
}

func SToI(s string) (int, error) {
	if s == "" {
		return 0, nil
	}

	a, err := strconv.Atoi(s)
	return a, err
}

func SToB(s string) (bool, error) {
	if s == "true" {
		return true, nil
	}

	return false, nil
}

func SToI64(s string) (int64, error) {
	if s == "" {
		return 0, nil
	}
	a, err := strconv.ParseInt(s, 10, 64)
	return a, err
}

func ParseQueryParameter(c *gin.Context) (*dream.QueryParameter, error) {
	SinceIDString := c.Query("since_id")
	SinceID, err := SToI(SinceIDString)
	if err != nil {
		return nil, err
	}
	MaxIDString := c.Query("max_id")
	MaxID, err := SToI(MaxIDString)
	if err != nil {
		return nil, err
	}
	PageString := c.Query("page")
	Page, err := SToI(PageString)
	if err != nil {
		return nil, err
	}
	CountString := c.Query("count")
	Count, err := SToI(CountString)
	if err != nil {
		return nil, err
	}
	AllString := c.Query("all")
	All, err := SToB(AllString)
	if err != nil {
		return nil, err
	}
	qp := &dream.QueryParameter{
		SinceID: int32(SinceID),
		MaxID:   int32(MaxID),
		Page:    int32(Page),
		Count:   int32(Count),
		All:     All,
	}

	return qp, nil
}
