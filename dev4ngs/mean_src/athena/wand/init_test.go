package wand_test

import (
	"git.ngs.tech/mean/athena/config"
)

func init() {
	config.GetConfig("../athena-config.test.ini")
}
