package main

import (
	"fmt"
)

const (
	B float64 = 1 << (iota * 10)
	KB
	MB
	GB
)

func main() {
	fmt.Println(B)
	fmt.Println(KB)
	fmt.Println(MB)
	fmt.Println(GB)

	var a int = 122
	a++
	var p *int = &a

	fmt.Println(a)
	fmt.Println(*p)

	b := 1
	for {
		if b > 3 {
			break
		}
		fmt.Println(b)
		b++
	}
}
