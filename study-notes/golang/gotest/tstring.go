package main

import (
	"fmt"
)

func tString_Arrary() {
	var str_arrary []string = []string{
		"a",
		"bbbbb",
		"ccccc",
	}
	fmt.Println(str_arrary[0])
	fmt.Println(str_arrary[1])
	fmt.Println(str_arrary[2])
}

func tString() {
	cat := "cat is cat"
	var one byte = cat[2]
	fmt.Println(cat)
	fmt.Println(one)
	fmt.Println(string(one))

	cat = "dog is dog"
	fmt.Println(cat)
	cat[0] = 't'
	fmt.Println(cat)

}

func main() {

	//tString_Arrary()
	tString()
}
