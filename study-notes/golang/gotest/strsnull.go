package main

import (
	"fmt"
)

func main() {
	uuids := []string{}

	uuids = append(uuids, "aaa")
	fmt.Println(uuids)
	fmt.Println(len(uuids))

	uuids = append(uuids, "bbb")
	fmt.Println(uuids)
	fmt.Println(len(uuids))

}
