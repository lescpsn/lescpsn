package trace

import (
	"errors"
	"time"

	"github.com/micro/go-micro/client"
	"github.com/micro/go-micro/registry"
	proto "github.com/micro/go-platform/trace/proto"

	"github.com/pborman/uuid"
	"golang.org/x/net/context"
)

type spanKey struct{}

type platform struct {
	opts  Options
	spans chan *Span
	exit  chan bool
}

func newPlatform(opts ...Option) Trace {
	var opt Options
	for _, o := range opts {
		o(&opt)
	}

	if opt.BatchSize == 0 {
		opt.BatchSize = DefaultBatchSize
	}

	if opt.BatchInterval == time.Duration(0) {
		opt.BatchInterval = DefaultBatchInterval
	}

	if len(opt.Topic) == 0 {
		opt.Topic = TraceTopic
	}

	if opt.Client == nil {
		opt.Client = client.DefaultClient
	}

	p := &platform{
		exit:  make(chan bool),
		opts:  opt,
		spans: make(chan *Span, 100),
	}

	go p.run()

	return p
}

func serviceToProto(s *registry.Service) *proto.Service {
	if s == nil {
		return nil
	}

	var nodes []*proto.Node

	// add node if it exists
	if len(s.Nodes) > 0 {
		nodes = []*proto.Node{&proto.Node{
			Id:       s.Nodes[0].Id,
			Address:  s.Nodes[0].Address,
			Port:     int64(s.Nodes[0].Port),
			Metadata: s.Nodes[0].Metadata,
		}}
	}

	return &proto.Service{
		Name:     s.Name,
		Version:  s.Version,
		Metadata: s.Metadata,
		Nodes:    nodes,
	}
}

func toProto(s *Span) *proto.Span {
	var annotations []*proto.Annotation

	for _, a := range s.Annotations {
		var timestamp int64
		if !a.Timestamp.IsZero() {
			timestamp = a.Timestamp.UnixNano() / 1e3
		}
		annotations = append(annotations, &proto.Annotation{
			Timestamp: timestamp,
			Type:      proto.Annotation_Type(a.Type),
			Key:       a.Key,
			Value:     a.Value,
			Debug:     a.Debug,
			Service:   serviceToProto(a.Service),
		})
	}

	var timestamp int64
	if !s.Timestamp.IsZero() {
		timestamp = s.Timestamp.UnixNano() / 1e3
	}

	return &proto.Span{
		Name:        s.Name,
		Id:          s.Id,
		TraceId:     s.TraceId,
		ParentId:    s.ParentId,
		Timestamp:   timestamp,
		Duration:    s.Duration.Nanoseconds() / 1e3,
		Debug:       s.Debug,
		Source:      serviceToProto(s.Source),
		Destination: serviceToProto(s.Destination),
		Annotations: annotations,
	}
}

func (p *platform) send(buf []*Span) {
	for _, s := range buf {
		pub := p.opts.Client.NewPublication(p.opts.Topic, toProto(s))
		p.opts.Client.Publish(context.TODO(), pub)
	}
}

func (p *platform) run() {
	t := time.NewTicker(p.opts.BatchInterval)

	var buf []*Span

	for {
		select {
		case s := <-p.spans:
			buf = append(buf, s)
			if len(buf) >= p.opts.BatchSize {
				go p.send(buf)
				buf = nil
			}
		case <-t.C:
			// flush
			if len(buf) > 0 {
				go p.send(buf)
				buf = nil
			}
		case <-p.exit:
			t.Stop()
			return
		}
	}
}

func (p *platform) Close() error {
	select {
	case <-p.exit:
		return nil
	default:
		close(p.exit)
	}
	return nil
}

func (p *platform) Collect(s *Span) error {
	select {
	case p.spans <- s:
	case <-time.After(p.opts.CollectTimeout):
		return errors.New("Timed out sending span")
	}
	return nil
}

func (p *platform) NewSpan(s *Span) *Span {
	if s == nil {
		// completeley new trace
		return &Span{
			Id:        uuid.NewUUID().String(),
			TraceId:   uuid.NewUUID().String(),
			ParentId:  "0",
			Timestamp: time.Now(),
			Source:    p.opts.Service,
		}
	}

	// existing trace in theory
	cp := &Span{}
	*cp = *s

	if len(s.TraceId) == 0 {
		cp.TraceId = uuid.NewUUID().String()
	}
	if len(s.ParentId) == 0 {
		cp.ParentId = "0"
	}
	if len(s.Id) == 0 {
		cp.Id = uuid.NewUUID().String()
	}
	if s.Timestamp.IsZero() {
		cp.Timestamp = time.Now()
	}
	if s.Source == nil {
		cp.Source = p.opts.Service
	}

	return cp
}

func (p *platform) FromContext(ctx context.Context) (*Span, bool) {
	s, ok := ctx.Value(spanKey{}).(*Span)
	return s, ok
}

func (p *platform) NewContext(ctx context.Context, s *Span) context.Context {
	return context.WithValue(ctx, spanKey{}, s)
}

func (p *platform) FromHeader(md map[string]string) (*Span, bool) {
	var debug bool
	if md[DebugHeader] == "1" {
		debug = true
	}

	// can we get span header and trace header?
	if len(md[SpanHeader]) == 0 && len(md[TraceHeader]) == 0 {
		return nil, false
	}

	return p.NewSpan(&Span{
		Id:       md[SpanHeader],
		TraceId:  md[TraceHeader],
		ParentId: md[ParentHeader],
		Debug:    debug,
	}), true
}

func (p *platform) NewHeader(md map[string]string, s *Span) map[string]string {
	debug := "0"
	if s.Debug {
		debug = "1"
	}

	md[SpanHeader] = s.Id
	md[TraceHeader] = s.TraceId
	md[ParentHeader] = s.ParentId
	md[DebugHeader] = debug
	return md
}

func (p *platform) String() string {
	return "platform"
}
