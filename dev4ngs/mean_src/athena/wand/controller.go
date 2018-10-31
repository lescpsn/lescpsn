package wand

import (
	. "git.ngs.tech/mean/athena/model"
	athena "git.ngs.tech/mean/proto"
	fRegistry "github.com/llcan1120/fast-registry"
	"github.com/micro/go-micro/broker"
	"github.com/micro/go-micro/client"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2"
	"os"
	"time"
)

type AthenaController struct {
	MDB  *mgo.Database
	User *athena.User
	//Logger *log.MeanLogger
	Broker broker.Broker
}

func NewAthenaController(MDBSession *mgo.Session, MDB *mgo.Database, b broker.Broker) *AthenaController {
	mc := &AthenaController{
		MDB:    MDB,
		Broker: b,
	}

	return mc
}

type SingleEntity struct {
	Validation NullBool   `json:"validation,omitempty"`
	QNToken    string     `json:"QN-Token,omitempty"`
	Expires    *time.Time `json:"QN-Expires,omitempty"`
}

const (
	DREAM_SERVICE_KEY = "tech-ngs-dream"
)

const (
	CONSUL_ADDRESSES_KEY = "CONSUL_ADDRS"
	META_ADDRESS_KEY     = "META_ADDRS"
)

var Cl athena.DreamServicesClient

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

	Cl = athena.NewDreamServicesClient(DREAM_SERVICE_KEY, c)
}
