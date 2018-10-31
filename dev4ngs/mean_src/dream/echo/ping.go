package echo

import (
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (d Dream) Ping(s StringType, ctx context.Context) (string, error) {
	return s.String_, nil
}
