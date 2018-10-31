package main

import (
	"fmt"
)

func main() {
	//定义一个10个元素的整型数组
	var myArray [10]int = [10]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

	//基于以上数组创建一个包含5个元素的数组切片
	var mySlice []int = myArray[:5]

	//分别打印
	for _, v := range myArray {
		fmt.Print(v, " ")
	}
	fmt.Println("")

	for _, v := range mySlice {
		fmt.Print(v, " ")
	}

}
