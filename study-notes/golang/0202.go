package main

import (
	"fmt"
)

var (
	age = 34
	sex = "male"
)

const (
	PI = 3.132
	G  = 9.18
)

type (
	myInt int
	myStr string
)

func main() {
	fmt.Println(PI, G)
	fmt.Println(age, sex)
}
