package phoenix

import (
	"git.ngs.tech/mean/phoenix/config"
	"git.ngs.tech/mean/phoenix/dream"
	"github.com/brandfolder/gin-gorelic"
	"github.com/gin-gonic/gin"
	"github.com/itsjamie/gin-cors"
	"net/http"
	"strconv"
	"time"
)

type QueryParameter struct {
	SinceID     int
	MaxID       int
	CurrentPage int
	Count       int
}

type Phoenix struct {
	Config *config.PhoenixConfig
	Route  *gin.Engine
}

const (
	GenericsSuccessCode = 200
	GenericsErrorCode   = 400
)

type HostSwitch map[string]http.Handler

const (
	GroupRouteVersion1Key = `/v1`
)

// Create Postgres Table
const (
	CreateSchemaRoute = `createschema` // GET
)

// Admin
const (
	InitDataToDBRoute      = "init_data_to_db"               //GET
	AddAdminRoute          = "admin/"                        //POST
	UpdateAdminRoute       = "admin/"                        //PUT
	DeleteAdminsRoute      = "admin/:IDS"                    //Delete
	SetRolesForAdminRoute  = "admin/roles/:AdminID/:RoleIDS" //PUT
	GetRolesByAdminIDRoute = "admin/roles/:AdminID"          //GET
	GetAdminByUUIDRoute    = `admin/item/:UUIDString`        // GET
	GetAdminByNameRoute    = "admin/uname/:Name"             //GET
	GetAdminListRoute      = "admin/list"                    //GET
	LoginRoute             = `admin/login`                   // POST
	LoginOutRoute          = `admin/logout`                  // GET
)

// User
const (
	UserStatusRoute       = `users/status`                // PUT
	UpdateUserDataRoute   = `user/:UUIDString`            // PUT
	AddUserRoute          = `user/add`                    // POST
	ChangeUserPassRoute   = `user/changepass/:UUIDString` // POST
	GetUserRoute          = `user/:UUIDString`            // GET
	GetUserByKeywordRoute = `users/search/:Keyword`       // GET
	GetUsersRoute         = `user/`                       // GET
	DeleteUserRoute       = `user/:UUIDString`            // DELETE
)

// Photo
const (
	GetPhotosRoute          = `photos/`                                // GET
	GetPhotosByUserRoute    = `photos/list/user/:UUIDString`           // GET
	PhotoPrivacyRoute       = `photos/privacy`                         // POST
	GetPhotoCommentRoute    = `photo/comments/:UUIDString`             // POST
	DeletePhotosRoute       = `photos/`                                // DELETE
	DeletePhotoRoute        = `photo/delete/:UUIDString`               // DELETE
	DeletePhotoCommentRoute = `photo/comment/:UUIDString/:CUUIDString` // DELETE
	GetPhotoDataRoute       = `photo/:UUIDString`                      // GET
	DeletePhotoNoteRoute    = `note/:UUIDString`                       // DELETE
)

// Notification
const (
	GetMsgListRoute = `msg/` // GET
	SendMsgRoute    = `msg/` // POST
)

// Suggestion
const (
	FeedbackRoute = `feedback` // GET POST
	//FeedbackRoute = `feedback/:UUIDString` // PUT DELETE
)

// Menu
const (
	GetMenuListRoute = `menu/list`             // GET
	GetMenuTreeRoute = `menu/tree`             // GET
	GetMenuByIDRoute = `menu/item/:UUIDString` // GET
	AddMenuRoute     = `menu/`                 // POST
	UpdateMenuRoute  = `menu/`                 // PUT
	DeleteMenuRoute  = `menu/:IDS`             // DELETES
)

// Role
const (
	GetRoleListRoute            = `role/list`                               // GET
	SetAdminsForRoleRoute       = "role/admins/:RoleID/:AdminIDS"           //PUT
	GetAdminsByRoleIDRoute      = "role/admins/:RoleID"                     //GET
	SetPermissionsForRoleRoute  = "role/permissions/:RoleID/:PermissionIDS" //PUT
	GetPermissionsByRoleIDRoute = "role/permissions/:RoleID"                //GET
	GetRoleByIDRoute            = `role/item/:RoleID`                       // GET
	AddRoleRoute                = `role/`                                   // POST
	UpdateRoleRoute             = `role/`                                   // PUT
	DeleteRoleRoute             = `role/:IDS`                               // DELETES
)

// Operation
const (
	GetOperationListRoute = `operation/list`             // GET
	GetOperationByIDRoute = `operation/item/:UUIDString` // GET
	AddOperationRoute     = `operation/`                 // POST
	UpdateOperationRoute  = `operation/`                 // PUT
	DeleteOperationRoute  = `operation/:IDS`             // DELETES
)

// Permission
const (
	GetPermissionListRoute           = `permission/list`                                   // GET
	GetPermissionByIDRoute           = `permission/item/:UUIDString`                       // GET
	AddPermissionRoute               = `permission/`                                       // POST
	UpdatePermissionRoute            = `permission/`                                       // PUT
	DeletePermissionRoute            = `permission/:IDS`                                   // DELETES
	SetMenusForPermissionRoute       = "permission/menus/:PermissionID/:MenuIDS"           //PUT
	GetMenusByPermissionIDRoute      = "permission/menus/:PermissionID"                    //GET
	SetOperationsPermissionIDRoute   = "permission/operations/:PermissionID/:OperationIDS" //PUT
	GetOperationsByPermissionIDRoute = "permission/operations/:PermissionID"               //GET
)

func (p *Phoenix) Engine() *gin.Engine {
	p.Route = gin.New()

	// global middleware
	p.Route.Use(gin.Logger())
	p.Route.Use(gin.Recovery())

	// new relic monitor
	gorelic.InitNewrelicAgent("f243fdc54ca4b221bbabef85444e798a6d946335", "Phoenix", false)
	p.Route.Use(gorelic.Handler)

	//解决跨域问题
	p.Route.Use(cors.Middleware(cors.Config{
		Origins:         "*",
		Methods:         "GET, PUT, POST, DELETE",
		RequestHeaders:  "Origin, Authorization, Content-Type",
		ExposedHeaders:  "",
		MaxAge:          50 * time.Second,
		Credentials:     false,
		ValidateHeaders: false,
	}))

	//	hs := make(HostSwitch)

	p.Route.Use(InitHandler(p.Config))
	p.Route.Use(ErrorDBTransactionHandler())
	p.Route.Use(HeaderErrorHandler())

	v1 := p.Route.Group(GroupRouteVersion1Key)
	{
		//const CreateSchemaRoute = `createschema` // GET

		WrapAccountRoutes(v1)
		//v1.Use(AuthorizationHandler())
		// WrapAdminRoutes(v1)
		// WrapUserRoutes(v1)
		// WrapPhotoRoutes(v1)
		// WrapFeedbackRoutes(v1)
		WrapErrMessageRoutes(v1)
		WrapAdminRoutes(v1)
		WrapMenuRoutes(v1)
		WrapRoleRoutes(v1)
		WrapOperationRoutes(v1)
		WrapPermissionRoutes(v1)
	}
	return p.Route
}

func SToI(s string) (int, error) {
	if s == "" {
		return 0, nil
	}

	a, err := strconv.Atoi(s)
	return a, err
}

func ParseQueryParameter(c *gin.Context) (*dream.AdminQueryParameter, error) {
	PageString := c.Query("p")
	Page, err := SToI(PageString)
	if err != nil {
		return nil, err
	}
	StatusString := c.Query("status")
	Status, err := SToI(StatusString)
	if err != nil {
		return nil, err
	}
	SinceString := c.Query("s")
	if err != nil {
		return nil, err
	}
	MaxString := c.Query("m")
	if err != nil {
		return nil, err
	}
	Sort := c.Query("sort")
	if err != nil {
		return nil, err
	}
	qp := &dream.AdminQueryParameter{
		CurrentPage: Page,
		SinceAt:     SinceString,
		MaxAt:       MaxString,
		Status:      Status,
		Sort:        Sort,
	}

	return qp, nil
}

func ParseCommentQueryParameter(c *gin.Context) (*dream.QueryParameter, error) {
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
	qp := &dream.QueryParameter{
		SinceID: SinceID,
		MaxID:   MaxID,
		Page:    Page,
		Count:   Count,
	}

	return qp, nil
}
