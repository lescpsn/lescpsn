package main

import (
	"fmt"
	"github.com/micro/cli"
	"github.com/micro/go-micro"
	proto "go.micro/greet/proto"
	"golang.org/x/net/context"
	"os"
)

type Greeter struct{}

func (g *Greeter) Hello(ctx context.Context, req *proto.HelloRequest, rsp *proto.HelloResponse) error {
	rsp.Greeting = "Hello" + req.Name
	return nil
}

func runClient(service micro.Service) {
	fmt.Println("This is my first go micro client...")
	greeter := proto.NewGreeterClient("greeter", service.Client())

	rsp, err := greeter.Hello(context.TODO(), &proto.HelloRequest{Name: "John"})
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(rsp.Greeting)

}
func main() {
	fmt.Println("This is my first go micro...")
	service := micro.NewService(
		micro.Name("greeter"),
		micro.Version("latest"),

		micro.Flags(cli.BoolFlag{
			Name:  "client",
			Usage: "Launch the client",
		}),
	)

	service.Init(
		micro.Action(func(c *cli.Context) {
			if c.Bool("client") {
				runClient(service)
				os.Exit(0)
			}

		}),
	)

	proto.RegisterGreeterHandler(service.Server(), new(Greeter))

	if err := service.Run(); err != nil {
		fmt.Println(err)
	}
}
