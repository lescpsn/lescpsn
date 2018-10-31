# Trace [![GoDoc](https://godoc.org/github.com/micro/go-platform?status.svg)](https://godoc.org/github.com/micro/go-platform/trace)

Provides a pluggable distributed tracing interface

```go
type Trace interface {
	Close() error
	// New span with certain fields preset.
	// Provide parent span if you have it.
	NewSpan(*Span) *Span
	// New context with span
	NewContext(context.Context, *Span) context.Context
	// Return a span from context
	FromContext(context.Context) (*Span, bool)
	// Span to Header
	NewHeader(map[string]string, *Span) map[string]string
	// Get span from header
	FromHeader(map[string]string) (*Span, bool)
	// Collect spans
	Collect(*Span) error
	// Name
	String() string
}

type Span struct {
	Name      string        // Topic / RPC Method
	Id        string        // id of this span
	TraceId   string        // The root trace id
	ParentId  string        // Parent span id
	Timestamp time.Time     // Microseconds from epoch. When span started.
	Duration  time.Duration // Microseconds. Duration of the span.
	Debug     bool          // Should persist no matter what.

	Source      *registry.Service // Originating service
	Destination *registry.Service // Destination service

	sync.Mutex
	Annotations []*Annotation
}

type Annotation struct {
	Timestamp time.Time // Microseconds from epoch
	Type      AnnotationType
	Key       string
	Value     []byte
	Debug     map[string]string
	Service   *registry.Service // Annotator
}

func NewTrace(opts ...Option) Trace {
	return newPlatform(opts...)
}
```

## Supported

- Trace service
- Zipkin

## Usage

You can either manually use the Trace interface to create and collect spans - look at the [wrappers](https://github.com/micro/go-platform/blob/master/trace/wrapper.go) 
for an example - or use the client and server wrappers which will be called on every request made or received.

Also check out [go-platform/examples/trace](https://github.com/micro/go-platform/tree/master/examples/trace).

```go
import (
	"github.com/micro/go-micro"
	"github.com/micro/go-micro/registry"
	"github.com/micro/go-platform/trace"
)

func main() {
	t := trace.NewTrace()

	srv := &registry.Service{Name: "go.micro.srv.example"}

	service := micro.NewService(
		micro.Name("go.micro.srv.example"),
		micro.WrapClient(trace.ClientWrapper(t, srv)),
		micro.WrapHandler(trace.HandlerWrapper(t, srv)),
	)
}
```

