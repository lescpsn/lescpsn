package main

import (
	"fmt"
)

func main() {
	var str_test = "ABCD"
	fmt.Printf("%s:%c\n", str_test, str_test[0])
	//str_test[0] = 't'
	//fmt.Printf("%s:%c", str_test, str_test[0])

	//	str_test[1]

	var array_test [5]int = [5]int{0, 1, 2, 3, 4}
	array_test[1] = 0
	fmt.Println(array_test)

}
