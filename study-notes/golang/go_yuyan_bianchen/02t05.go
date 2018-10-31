package main

import (
	"fmt"
)

func main() {

	f_ret := func(x, y int) int {
		return x + y
	}

	fmt.Println("ok", f_ret, f_ret(5, 6))

	a := func(x int) int {
		return x + 1
	}

	b := a(2)
	fmt.Println("ok", b)

	f := func(i, j int) (ret int) {
		ret = i + j
		return ret
	}
	fmt.Printf("f = %v, f(1,3) = %v\n", f, f(1, 3))

	f_ret1, f_ret2 := func(i, j int) (m, n int) {
		return j, i
	}(1, 9)
	fmt.Println(f_ret1, f_ret2)

}
