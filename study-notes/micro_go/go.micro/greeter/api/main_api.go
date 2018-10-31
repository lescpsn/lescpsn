package main

import (
	"encoding/json"
	"github.com/micro/go-micro/client"
	"github.com/micro/go-micro/cmd"
	"github.com/micro/go-micro/errors"
	"github.com/micro/go-micro/server"
	api "github.com/micro/micro/api/proto"
	hello "go.micro/greeter/server/proto/hello"
	"golang.org/x/net/context"
	"log"
	"strings"
)

type Say struct{}

func (s *Say) Hello(ctx context.Context, req *api.Request, rsp *api.Response) error {
	log.Print("Received Say.Hello API request")

	name, ok := req.Get["name"]
	if !ok || len(name.Values) == 0 {
		return errors.BadRequest("go.micro.api.greeter", "Name cannot be blank")
	}
	log.Print("name = ", name)
	request := client.NewRequest("go.micro.srv.greeter", "Say.Hello", &hello.Request{
		Name: strings.Join(name.Values, " "),
	})
	response := &hello.Response{}

	if err := client.Call(ctx, request, response); err != nil {
		return err
	}
	rsp.StatusCode = 200

	b, _ := json.Marshal(map[string]string{
		"message": response.Msg,
	})

	rsp.Body = string(b)

	return nil
}

func main() {
	cmd.Init()

	server.Init(
		server.Name("go.micro.api.greeter"),
	)

	server.Handle(
		server.NewHandler(
			new(Say),
		),
	)

	if err := server.Run(); err != nil {
		log.Fatal(err)
	}
}
