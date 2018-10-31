// Author：	Hengjun che
// Email:	hengjun@ngs.tech
// Description:	This File is testing libgo package

package main

import (
	"fmt"
	"git.ngs.tech/mean/hera/libgo"
)

func main() {
	fmt.Println(libgo.RandInt(20, 25))
	fmt.Println(libgo.RandBirth(20, 25))
}
