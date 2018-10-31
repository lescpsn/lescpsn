package test

import (
	"fmt"
)

const (
	B float64 = 1 << (iota * 10)
	KB
)

func F0501() {
	a := 1
	switch a {
	case 0:
		fmt.Println("a=0")
	case 1:
		fmt.Println("a=1")
	}
}

func F0502() {

	for {
		for i := 0; i < 10; i++ {
			if i > 3 {
				goto LAB1
			}
		}

	}

LAB1:
	fmt.Println("break ok")
}

func F0501_1() {
	fmt.Println("This is function F0501_1:")
	fmt.Println(B)
	fmt.Println(KB)

}

func F0502_1() {
	fmt.Println("This is function F0501_2:")
	i := 64
	i++
	var pt *int = &i
	fmt.Println(i, *pt)

}

func F0503() {
	fmt.Println("This is function F0503:")
	a := 10
	if a := 1; a > 0 {
		fmt.Println(a)
	}
	fmt.Println(a)

}
func F0504() {
	fmt.Println("This is function F0504:")

	for i := 0; i < 3; i++ {
		fmt.Println(i)
	}
}

func F0505() {
	fmt.Println("This is function F0504:")
	i := 9
	switch i {
	case 0:
		fmt.Println("i=0")
	case 1:
		fmt.Println("i=1")
	}
}
func F0506() {

LABEL1:
	for {
		for i := 0; i < 3; i++ {
			if i > 3 {
				break LABEL1
			}
		}
		fmt.Println("This is function F0506:")
	}
	fmt.Println("This is function F0506:ok")
}
