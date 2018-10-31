package api_test

import (
	"fmt"
	"git.ngs.tech/mean/trial/config"
	"github.com/h2non/baloo"
	"gopkg.in/h2non/gentleman.v1/plugins/multipart"
	"io/ioutil"
	"net/http"
	"os"
	"testing"
)

type Dungeons map[string]string

func init() {
	baloo.AddAssertFunc("test", assert)
}

// assert 请求出错，打印错误返回信息，正确不打印返回信息
func assert(res *http.Response, req *http.Request) error {
	if res.StatusCode == 200 || res.StatusCode == 204 || res.StatusCode == 205 {
		fmt.Println("testing [\033[32mok\033[0m]")

	} else if res.StatusCode != 200 {
		fmt.Println("testing [\033[31mfailed\033[0m]")
		body, _ := ioutil.ReadAll(res.Body)
		fmt.Println(string(body))
	}

	return nil
}

var AuthToken string
var DeviceToken string

func TestApi(t *testing.T) {
	p, err := config.GetApi()
	if err != nil {
		return
	}
	// 获取token
	AuthToken = p.Token[`X-Tuso-Authentication-Token`]
	DeviceToken = p.Token[`X-Tuso-Device-Token`]

	// 获取请求主机
	var testTuso = baloo.New(p.RequetHost[`TusoHost`])
	var testQiniu = baloo.New(p.RequetHost[`QiniuHost`])
	var test *baloo.Client

	var apiarray_len = len(p.ApiTestArray)
	for _, v := range p.HttpRequest {
		if apiarray_len != 0 {
			kv, ok := p.ApiTestArray[v[`id`].(string)]
			if (ok && kv == false) || !ok {
				continue
			}
		}
		if v[`request_host`] == "QiniuHost" {
			fmt.Printf("[\033[32m Request %s:%s \033[0m]\n", v[`request_host`], p.RequetHost[`QiniuHost`])
			test = testQiniu
		} else if v[`request_host`] == "TusoHost" {
			fmt.Printf("[\033[32m Request %s:%s \033[0m]\n", v[`request_host`], p.RequetHost[`TusoHost`])
			test = testTuso
		}
		switch v[`method`] {
		case "GET":
			GetRequest(t, test, v)
		case "PUT":
			PutRequest(t, test, v)
		case "POST":
			PostRequest(t, test, v)
		case "DELETE":
			DelRequest(t, test, v)
		case "POSTBIN":
			PostBinRequest(t, test, v)
		}
	}
}

func GetRequest(t *testing.T, test *baloo.Client, req config.Httprequest) {
	fmt.Printf("[\033[32mGET\033[0m]\tRequest:[%s]%s\n", req[`id`], req[`path`])
	fmt.Println("\tParams:", req[`params`])
	test.Get(req[`path`].(string)).
		SetHeader("X-Tuso-Device-Token", DeviceToken).
		SetHeader("X-Tuso-Authentication-Token", AuthToken).
		Expect(t).
		Assert("test").
		Done()
	fmt.Println("\033[33m--------------------------------------------------------------------------------\033[0m")
}

func PutRequest(t *testing.T, test *baloo.Client, req config.Httprequest) {
	fmt.Printf("[\033[32mPUT\033[0m]\tRequest:[%s]%s\n", req[`id`], req[`path`])
	fmt.Println("\tParams:", req[`params`])
	test.Put(req[`path`].(string)).
		SetHeader("X-Tuso-Device-Token", DeviceToken).
		SetHeader("X-Tuso-Authentication-Token", AuthToken).
		JSON(req[`params`]).
		Expect(t).
		Assert("test").
		Done()
	fmt.Println("\033[33m--------------------------------------------------------------------------------\033[0m")
}

func PostRequest(t *testing.T, test *baloo.Client, req config.Httprequest) {
	fmt.Printf("[\033[32mPOST\033[0m]\tRequest:[%s]%s\n", req[`id`], req[`path`])
	fmt.Println("\tParams:", req[`params`])
	test.Post(req[`path`].(string)).
		SetHeader("X-Tuso-Device-Token", DeviceToken).
		SetHeader("X-Tuso-Authentication-Token", AuthToken).
		JSON(req[`params`]).
		Expect(t).
		Assert("test").
		Done()
	fmt.Println("\033[33m--------------------------------------------------------------------------------\033[0m")
}

func DelRequest(t *testing.T, test *baloo.Client, req config.Httprequest) {
	fmt.Printf("[\033[32mPUT\033[0m]\tRequest:[%s]%s\n", req[`id`], req[`path`])
	test.Delete(req[`path`].(string)).
		SetHeader("X-Tuso-Device-Token", DeviceToken).
		SetHeader("X-Tuso-Authentication-Token", AuthToken).
		JSON(req[`params`]).
		Expect(t).
		Assert("test").
		Done()
	fmt.Println("\033[33m--------------------------------------------------------------------------------\033[0m")
}
func PostBinRequest(t *testing.T, test *baloo.Client, req config.Httprequest) {
	fmt.Printf("[\033[32mPOSTBIN\033[0m]\tRequest:[%s]%s\n", req[`id`], req[`path`])
	fmt.Println("Params:", req[`params`])
	params := req[`params`].(map[string]interface{})
	var path string = params[`file`].(string)
	fd, err := os.Open(path)
	if err != nil {
		return
	}
	defer fd.Close()
	data_fields := make(multipart.DataFields)
	data_fields[`x:timestamp`] = params[`x:timestamp`].(string)
	data_fields[`x:ut`] = params[`x:ut`].(string)
	data_fields[`token`] = params[`token`].(string)
	data := multipart.FormData{
		data_fields,
		[]multipart.FormFile{{"file", fd}},
	}
	test.Post(req[`path`].(string)).Form(data).
		Expect(t).
		Assert("test").
		Done()
	fmt.Println("\033[33m--------------------------------------------------------------------------------\033[0m")
}
