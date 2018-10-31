package main

import (
	"fmt"
	"math"
)

func adder() func(int) int {
	sum := 0
	return func(x int) int {
		sum += x
		return sum
	}
}

func getSeq() func() int {
	i := 0
	return func() int {
		i += 1
		return i
	}
}

func test_close() func() {
	i := 10
	return func() {
		fmt.Println("i", i)
	}
}

func main() {
	var j int = 5

	a := func() func() {
		var i int = 10
		return func() {
			fmt.Println("i,j:", i, j)
		}
	}
	a()()
	j *= 2
	a()()

	pos, neg := adder(), adder()

	for i := 0; i < 5; i++ {
		fmt.Println(pos(i), neg(-2*i))
	}

	getSquare := func(x float64) float64 {
		return math.Sqrt(x)
	}

	fmt.Println(getSquare(9))

	nextNum := getSeq()
	fmt.Println(nextNum())
	fmt.Println(nextNum())
	fmt.Println(nextNum())

	nextNum1 := getSeq()
	fmt.Println(nextNum1())
	fmt.Println(nextNum1())

	add := func(base int) func(int) {
		i := 22 + base
		return func(x int) {
			fmt.Println("ok:i=", i+x)
		}
	}(4)

	add(5)

	//	fmt.Println(add5(10))

}
