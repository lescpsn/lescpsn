package hera

type SockpuppetStarToTuso struct {
	SockpuppetUUIDs []string `form:"sockpuppetuuids" json:"sockpuppetuuids" binding:"required"`
	TusoUUIDs       []string `form:"tusouuids" json:"tusouuids" binding:"required"`
}

type GetAllUserTuso struct {
	offsetHead int      `form:"offsethead" json:"offsethead" binding:"required"`
	offsetTail int      `form:"offsettail" json:"offsettail" binding:"required"`
	pageSize   int      `form:"pagesize" json:"pagesize" binding:"required"`
	pageData   []string `form:"pagedata" json:"pagedata" binding:"required"`
}
