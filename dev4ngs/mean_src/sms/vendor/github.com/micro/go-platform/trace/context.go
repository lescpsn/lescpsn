package trace

import (
	"golang.org/x/net/context"
)

type traceKey struct{}

func FromContext(ctx context.Context) (Trace, bool) {
	c, ok := ctx.Value(traceKey{}).(Trace)
	return c, ok
}

func NewContext(ctx context.Context, c Trace) context.Context {
	return context.WithValue(ctx, traceKey{}, c)
}
