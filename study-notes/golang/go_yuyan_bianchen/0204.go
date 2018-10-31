package main

import (
	"fmt"
)

func MyPrintf(args ...interface{}) {
	//获取args的类型
	//int
	//string
	//int64
	//default
	for _, arg := range args {
		switch arg.(type) {
		case int:
			fmt.Println(arg, "is a int value")
		case string:
			fmt.Println(arg, "is a string value")
		case int64:
			fmt.Println(arg, "is a int64 value")
		default:
			fmt.Println(arg, "is a unkonwn value")
		}
	}

}

func main() {

	//1,234,"hello",1.2345
	//调用MyPrintf
	v1, v2, v3, v4 := 1, 234, "hello", 1.2345
	fmt.Println(v1, v2, v3, v4)
	MyPrintf(v1, v2, v3, v4)
}
