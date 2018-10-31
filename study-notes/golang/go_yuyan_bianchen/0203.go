package main

import (
	"fmt"
)

// 定义 PersonInfo 结构
type PersonInfo struct {
	Id   string
	Name string
	Addr string
}

func example(x int) int {
	if x == 0 {
		return 0
	} else {
		return x
	}
}

func Add(a int, b int) (ret int, r bool) {
	if a < 0 || b < 0 {
		return
	}

	ret = a + b
	return ret, true
}

func myfunc(args ...int) {
	for _, v := range args {
		fmt.Println(v)
	}
}

func myfunc2(args []int) {
	for _, v := range args {
		fmt.Println(v)
	}
}

func myfunc3(args ...int) {
	myfunc(args...)

	myfunc(args[1:]...)
}

func main() {
	// 定义 PersonDB, 身份证id
	PersonDB := make(map[string]PersonInfo)

	// 手工插入数据
	PersonDB["00001"] = PersonInfo{
		"20160601",
		"chehj",
		"mas",
	}
	PersonDB["00002"] = PersonInfo{
		"20160602",
		"carhj",
		"nanjin",
	}
	fmt.Println("ok:", PersonDB)

	// 查找某个键值的数据
	person, ok := PersonDB["00009"]
	fmt.Println(person, ok)
	if ok {

		fmt.Println(person, ok)
	} else {
		fmt.Println(person, "is null")
	}

	i := 9
	if i < 5 {
		fmt.Println(i, "i<5")
	} else {
		fmt.Println(i, "i>5")
	}

	j := example(i)
	fmt.Println(j)

	j = 11
	switch j {

	case 0:
		fmt.Println("0")

	case 1:
		fmt.Println("1")

	case 2:
		fmt.Println("2")

	case 3:
		fmt.Println("3")

	case 4:
		fallthrough

	case 5:
		fmt.Println("5")

	case 6, 7, 8, 9:
		fmt.Println("6,7,8,9")

	default:
		fmt.Println("default")

	}

	switch {

	case j >= 0 && j < 9:
		fmt.Println("0--9")

	case j >= 10 && j < 99:
		fmt.Println("10--99")
	}

	sum := 0
	for v := 0; v <= 100; v++ {
		sum += v
	}
	fmt.Println("sum:", sum)

	sum = 0
	v := 0
	for {
		if v > 100 {
			break
		}
		sum += v
		v++
	}
	fmt.Println("sum2:", sum)

	var_add, ok := Add(3, -8)
	fmt.Println("add result:", var_add)

	myfunc(1, 3, 4)
	fmt.Println("-----------------")
	myfunc2([]int{12, 32, 42})

	fmt.Println("-----------------")
	myfunc3(99, 3, 33, 222)

	fmt.Printf(format string, a ...interface{})

}
