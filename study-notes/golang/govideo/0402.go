package main

import (
	"fmt"
)

const mystr = "124"

const (
	a, b = 1, 2
	c, d
)

const (
	SU = iota
	MO
	TH
	WE
)

const (
	f = iota
)

func main() {

	fmt.Println(a)
	fmt.Println(b)

	fmt.Println(d)
	fmt.Println(c)

	fmt.Println(SU)
	fmt.Println(TH)

	fmt.Println(f)

	a := 0
	if a > 0 && (10/a) > 1 {
		fmt.Println("ok")
	} else {
		fmt.Println("not ok")
	}

}
