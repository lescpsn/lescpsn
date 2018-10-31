package phoenix

import (
	"crypto/sha1"
	"fmt"
	"git.ngs.tech/mean/phoenix/dream"
)

type Pass struct {
	OldPass string
	Salt    string
	Pass    string
}

func PassEncrypt(oPass string) *Pass {
	pass := &Pass{
		OldPass: oPass,
	}
	pass.passEncrypt()
	return pass
}
func (pass *Pass) passEncrypt() {
	pass.Salt = dream.RandomString(32)
	saltPassword := append([]byte(pass.Salt), pass.OldPass...)
	h := sha1.New()
	h.Write([]byte(saltPassword))
	pass.Pass = fmt.Sprintf("%x", h.Sum(nil))
}
