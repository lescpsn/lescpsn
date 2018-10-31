package main

import (
	"fmt"
	"os"
	"syscall"
)

var Host []string = []string{
	"root@192.168.1.1:8022[网关主机]",
	"chehj@192.168.1.2:7022[数据库主机]",
	"abb@192.168.1.1:8022[网关主机]",
	"192.168.1.4",
	"192.168.1.5",
	"192.168.1.6",
	"192.168.1.7",
	"192.168.1.8",
	"192.168.1.9",
	"192.168.1.10",
}

func main() {
	fmt.Printf("\012")
	fmt.Printf("\033[32m\t\tWelcome To Access NGS Security Access Gateway\033[0m\012")

	for i, h := range Host {
		if i&1 == 0 {
			fmt.Printf("\012")
		}
		fmt.Printf("[\033[31m%d\033[0m]%-40s\t", i+1, h)

	}
	fmt.Printf("\012\012")

	fmt.Printf("\t\t\tYour Choice:\012")

	env := os.Environ()
	if err := syscall.Exec("/Users/carhj/goproject/src/sag/autossh.exp", nil, env); err != nil {
		fmt.Println(err)
	}
}
