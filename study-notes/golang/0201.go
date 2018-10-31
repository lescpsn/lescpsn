package main

import (
	"fmt"
	tmf "fmt"
)

const PI = 3.14

var name = "che hengjun"

type myInt int

type myStruct struct{}

type myInterface interface{}

func main() {
	fmt.Println("basic package name: fmt")
	tmf.Println("alias package name: tmf")
}
