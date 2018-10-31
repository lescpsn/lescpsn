package test

import (
	"fmt"
)

func F0401() {
	var a int = 65
	b := string(a)
	fmt.Println(a, b)
}

const a, b, c = 1, 2, "3"
const (
	d    = "123"
	dlen = len(d)
)

func F0402() {
	fmt.Println(a, b, c)
	fmt.Println(d, dlen)
}
