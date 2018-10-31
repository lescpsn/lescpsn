package main

import (
	"fmt"
)

type (
	byte     int8
	rune     int32
	文本       string
	ByteSize int64
)

var a = true

func main() {

	//var a [2]byte

	a, _, c, d := 1, 2, 3, 4
	fmt.Println(a, c, d)
	fmt.Println(a)

	var f float32 = 100.1
	fmt.Println(f)
	f2 := int(f)
	fmt.Println(f2)
}
