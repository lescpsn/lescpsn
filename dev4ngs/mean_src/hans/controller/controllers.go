package controller

import (
	. "git.ngs.tech/mean/hans/model"
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	fRegistry "github.com/llcan1120/fast-registry"
	"github.com/micro/go-micro/client"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
	"os"
	"time"
)

type MeanController struct {
	RDB  *gorm.DB
	MDB  *mgo.Database
	User *User
	//Logger *log.MeanLogger
}

func NewMeanController(RDB *gorm.DB, MDBSession *mgo.Session, MDB *mgo.Database) *MeanController {
	mc := &MeanController{
		RDB: RDB,
		MDB: MDB,
	}

	return mc
}

type SingleEntity struct {
	Validation NullBool   `json:"validation,omitempty"`
	QNToken    string     `json:"QN-Token,omitempty"`
	Expires    *time.Time `json:"QN-Expires,omitempty"`
}

const (
	HANS_SERVICE_KEY     = "tech-ngs-hans"
	CONSUL_ADDRESSES_KEY = "CONSUL_ADDRS"
)

var Cl DreamServicesClient

type TimeWrapper struct {
	client.Client
}

func (l *TimeWrapper) Call(ctx context.Context, req client.Request, rsp interface{}, opts ...client.CallOption) error {
	start := time.Now()

	defer func() {
		end := time.Now()
		end.Sub(start)
	}()

	return l.Client.Call(ctx, req, rsp)
}

func Wrapper(c client.Client) client.Client {
	return &TimeWrapper{c}
}

func InitDreamClient() {
	reg := fRegistry.NewRegistry(
		fRegistry.Addrs(os.Getenv(CONSUL_ADDRESSES_KEY)),
	)

	c := client.NewClient(
		client.Registry(reg),
		client.Wrap(Wrapper),
	)

	Cl = NewDreamServicesClient(HANS_SERVICE_KEY, c)
}
