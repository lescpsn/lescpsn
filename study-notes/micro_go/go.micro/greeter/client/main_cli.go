package main

import (
	"fmt"
	"github.com/micro/go-micro/client"
	"github.com/micro/go-micro/cmd"
	"github.com/micro/go-micro/metadata"
	hello "go.micro/greeter/server/proto/hello"
	"golang.org/x/net/context"
)

func main() {
	cmd.Init()

	// Create new request to service go.micro.srv.greeter, method Say.Hello
	req := client.NewRequest("go.micro.srv.greeter", "Say.Hello", &hello.Request{
		Name: "carhj",
	})

	ctx := metadata.NewContext(context.Background(), map[string]string{
		"X-User-Id": "carhj",
		"X-From-Id": "script",
	})

	rsp := &hello.Response{}

	fmt.Println(ctx, req)
	if err := client.Call(ctx, req, rsp); err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(rsp.Msg)

}
