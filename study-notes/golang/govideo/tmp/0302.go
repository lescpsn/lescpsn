package main

import (
	"fmt"
)

type (
	byte int8
	文本   string
)

func main() {
	a, _, c, d := 65, 2, 3, 4
	fmt.Println(a, c, d)
	var s string
	s = string(a)
	fmt.Println(s, len(s))
}
