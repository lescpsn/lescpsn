package main

import (
	"fmt"
)

func main() {

	mySlice := make([]int, 5, 10)

	fmt.Println("len(mySlice):", len(mySlice))
	fmt.Println("cap(mySlice):", cap(mySlice))

	mySlice = append(mySlice, 1, 2, 3)

	for i, k := range mySlice {
		fmt.Println(i, ":", k)
	}

	mySlice2 := []int{8, 9, 10, 11, 12, 13, 14, 15}
	mySlice = append(mySlice, mySlice2...)

	fmt.Println(mySlice)

	fmt.Println("len(mySlice):", len(mySlice))
	fmt.Println("cap(mySlice):", cap(mySlice))

	mySlice3 := mySlice[:20]
	fmt.Println(mySlice3)

	slice1 := []int{1, 2, 3, 4, 5}
	slice2 := []int{5, 4, 3}
	fmt.Println("slice1:", slice1)
	fmt.Println("slice2:", slice2)
	copy(slice1, slice2)
	//copy(slice2, slice1)
	fmt.Println("slice1:", slice1)
	fmt.Println("slice2:", slice2)

}
