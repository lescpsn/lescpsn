package main

import (
	"fmt"
	"math"
)

func main() {
	var a [1]byte
	fmt.Println(a)
	fmt.Println(math.MaxInt16)

	var b float32

	b = 111.11
	fmt.Println(b)
	var c int
	c = int(b)
	fmt.Println(c)

}
