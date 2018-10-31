package email

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"net/url"
)

const (
	mailApiUser = "MEAN_APPLICATION_SERVRE_KEY"
	mailApiKey  = "0VPJiORSvRcujItg"
	sendMailApi = "http://api.sendcloud.net/apiv2/mail/send"
	from        = "admin@ngs.tech"
	fromName    = "图说Tuso"
)

type CommonMail map[string]string
type Resp struct {
	StatusCode int       `json:"statusCode"`
	Message    string    `json:"message"`
	Result     bool      `json:"result"`
	Info       *RespInfo `json:"info"`
}
type RespInfo struct {
	MaillistTaskId []int `json:"maillistTaskId"`
}

func NewCommonMsg() CommonMail {
	c := CommonMail{
		"apiUser":  mailApiUser,
		"apiKey":   mailApiKey,
		"from":     from,
		"fromName": fromName,
	}
	return c
}
func (msg CommonMail) Send(to, content, subject string) error {
	msg["to"] = to
	msg["subject"] = subject
	msg["html"] = content

	v := url.Values{}
	for key, value := range msg {
		v.Set(key, value)
	}

	client := &http.Client{}
	req, _ := http.NewRequest("POST", sendMailApi, bytes.NewBuffer([]byte(v.Encode())))
	req.Header.Set("Host", sendMailApi)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := client.Do(req) //发送
	if err != nil {
		return err
	}
	defer resp.Body.Close() //一定要关闭resp.Body
	respbody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	var respJson = &Resp{}
	err = json.Unmarshal(respbody, respJson)
	if err != nil {
		return err
	}
	if !respJson.Result {
		return errors.New(respJson.Message)
	}
	return nil
}
