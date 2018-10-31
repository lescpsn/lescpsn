// This file "sms.go" is created by Lincan Li at 6/17/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"errors"
	"git.ngs.tech/mean/sms/mars"
	. "git.ngs.tech/mean/sms/proto/sms"
	"github.com/levigross/grequests"
	"golang.org/x/net/context"
	"log"
	"regexp"
)

const (
	smsAccessKey = "dc85fd5669063d32abc091f8a046ca86"
	sendSMSURL   = "https://sms.yunpian.com/v2/sms/single_send.json"
)

const (
	SMSContentRegister string = "【图说Tuso】欢迎您注册图说，您的验证码是: $code ，验证码有效期为 10 分钟"
	SMSContentValidate string = "【图说Tuso】您的验证码是: $code ，验证码有效期为 10 分钟"
)

func requestOptions(mobile string, text string) *grequests.RequestOptions {
	options := &grequests.RequestOptions{
		Headers: map[string]string{
			"Content-type": "application/x-www-form-urlencoded",
			"Accept":       "text/plain",
		},
		Params: map[string]string{
			"apikey": smsAccessKey,
			"mobile": mobile,
			"text":   text,
		},
	}

	return options
}

func SendTemplatedSMS(mobile, content string) (*SMSResult, error) {
	response, err := grequests.Post(sendSMSURL, requestOptions(mobile, content))
	if err != nil {
		return nil, err
	}
	if !response.Ok {
		err := errors.New("request fail but not error found")
		return nil, err
	}

	var sResult SMSResult
	if err := response.JSON(&sResult); err != nil {
		return nil, err
	}

	if sResult.Code != 0 {
		log.Printf("SMS Result %v ", sResult)
		return nil, err
	}

	return &sResult, nil
}

func compileContent(content, code string) string {
	r, _ := regexp.Compile(`\$code`)
	content = r.ReplaceAllString(content, code)
	return content
}

type SMS struct{}

// SendRegisterSMS method, send out register used SMS code
func (s SMS) SendRegisterSMS(ctx context.Context, req *RegisterSMSRequest, rsp *SMSResponse) error {
	content := compileContent(string(SMSContentRegister), req.Code)

	sResult, err := SendTemplatedSMS(req.Mobile, content)
	if err != nil {
		rsp.Error = err.Error()
	}

	rsp.Success = err == nil
	rsp.SmsResult = sResult
	rsp.RequestCode = req.Code

	go mars.InsertSMSHistory(&mars.SMSHistory{MobileNumber: req.Mobile, Message: content})

	return nil
}

// SendNewPasswordSMS method, send out register used SMS code
func (s SMS) SendGenericSMS(ctx context.Context, req *GenericSMSValidationRequest, rsp *SMSResponse) error {
	content := compileContent(string(SMSContentValidate), req.Code)

	sResult, err := SendTemplatedSMS(req.Mobile, content)
	if err != nil {
		rsp.Error = err.Error()
	}

	rsp.Success = err == nil
	rsp.SmsResult = sResult
	rsp.RequestCode = req.Code

	go mars.InsertSMSHistory(&mars.SMSHistory{UserUUID: req.UserUUID, MobileNumber: req.Mobile, Message: content})

	return nil
}
