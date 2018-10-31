package main

import (
	"fmt"
)

func modify(array_v [5]int) {
	array_v[0] = 99
	fmt.Println(array_v)
}

func main() {
	array_t := [5]int{0, 1, 2, 3, 4}
	fmt.Println(array_t)
	modify(array_t)
	fmt.Println(array_t)
}
