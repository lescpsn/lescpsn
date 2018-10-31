package hera

const (
	MeanErrorHandleTypeHeader MeanErrorHandleType = 1 + iota
	MeanErrorHandelTypeBody
)

// 版本号
const (
	GroupRouteVersion1Key = `/v1`
)

// Controller Key
const (
	MeanControllerKey  = "MeanControllerKey"
	MeanErrorHandelKey = "MeanReturnErrInBodyKey"
)

// 返回码
const (
	GenericsSuccessCode = 200
)

// 马甲号的增，删，改，查
const (
	BatchAddSockpuppetsRoute   = `hera/pup/`     //POST
	BatchGetSockpuppetsRoute   = `hera/pup/`     //GET
	BatchSetSockpuppetRoute    = `hera/pup/`     //PUT
	BatchDeleteSockpuppetRoute = `hera/pup/`     //DELETE
	SockpuppetStarToTusoRoute  = `hera/pup/star` //POST
)

// 图说
const (
	GetAllUserTusoRoute = `hera/tuso` //GET
)

// 用户的好友，关注人，被关注人
const (
	GetAllUserAllRelationRoute   = `hera/relation`       //GET
	GetRelation4FollowerRoute = `hera/relation/follower` //GET
	GetRelation4FolloweeRoute = `hera/relation/followee` //GET
)
