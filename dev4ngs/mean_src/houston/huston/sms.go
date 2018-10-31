// This file "sms.go" is created by Lincan Li at 12/14/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package huston

import (
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"github.com/levigross/grequests"
	"gopkg.in/mgo.v2"
	"math/rand"
	"regexp"
	"time"
)

const (
	smsAccessKey = "dc85fd5669063d32abc091f8a046ca86"
	sendSMSURL   = "https://sms.yunpian.com/v2/sms/single_send.json"
	smsLength    = 6
)

type SMSContent string

const (
	SMSContentRegister SMSContent = "【图说Tuso】欢迎您注册图说，您的验证码是: $code ，验证码有效期为 10 分钟"
	SMSContentValidate SMSContent = "【图说Tuso】您的验证码是: $code ，验证码有效期为 10 分钟"
)

type MeanSMSManager struct {
	user *User
}

type SMSResponse struct {
	Code    int    `json:"code"`
	Message string `json:"msg"`
	Detail  string `json:"detail"`
}

func NewSMSManager() *MeanSMSManager {
	manager := &MeanSMSManager{}
	return manager
}

func (s *MeanSMSManager) SetUser(u *User) {
	s.user = u
}

func (s *MeanSMSManager) requestOptions(mobile string, text string) *grequests.RequestOptions {
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

func (s *MeanSMSManager) sendTemplateSMS(mobile, text string) error {
	options := s.requestOptions(mobile, text)
	response, err := grequests.Post(sendSMSURL, options)
	if err != nil {
		return err
	}

	if !response.Ok {
		return response.Error
	}

	var smsResponse SMSResponse
	if err := response.JSON(&smsResponse); err != nil {
		return err
	}

	if smsResponse.Code != 0 {
		return err
	}

	return nil
}

func compileContent(content, code string) string {
	r, _ := regexp.Compile(`\$code`)
	content = r.ReplaceAllString(content, code)
	return content
}

func generateCode(codeLength int) string {
	rand.Seed(time.Now().UTC().UnixNano())
	bytes := make([]byte, codeLength)

	for i := 0; i < codeLength; i++ {
		bytes[i] = byte(rand.Int())
	}

	return string(bytes)
}

// SendRegisterSMS method, send out register used SMS code
func (s *MeanSMSManager) SendRegisterSMS(MDB *mgo.Database, mobile string) (string, error) {
	smsAccount, err := GetSMSAccountByPhoneNumber(MDB, mobile)
	if err != nil {
		return "", err
	}

	if smsAccount != nil {
		if smsAccount, err = smsAccount.UpdateCodeAndSecret(MDB); err != nil {
			return "", err
		}
	} else {
		if smsAccount, err = NewSMSAccount(MDB, mobile); err != nil {
			return "", err
		}
	}

	content := compileContent(string(SMSContentRegister), smsAccount.Code)

	if err := s.sendTemplateSMS(mobile, content); err != nil {
		return "", err
	}

	return smsAccount.Code, nil
}

// SendNewPasswordSMS method, send out register used SMS code
func (s *MeanSMSManager) SendNewPasswordSMS(MDB *mgo.Database) (string, error) {
	smsCode := generateCode(smsLength)
	content := compileContent(string(SMSContentValidate), smsCode)

	us, err := GetUserSecrets(MDB, Str2UUID(s.user.UUID))
	if err != nil {
		return "", err
	}

	se := &Secret{
		UserSecretType: UserSecretTypeNewPassword,
		Code:           smsCode,
		Secret:         RandomString(32),
	}

	if _, err := us.AppendSecret(MDB, se); err != nil {
		return "", err
	}

	if err := s.sendTemplateSMS(s.user.MobileNumber.GetString(), content); err != nil {
		return "", err
	}

	return smsCode, nil
}

func (m *MeanController) NewRegisterSMS(mobile string) (string, error) {
	s := &MeanSMSManager{}
	code, err := s.SendRegisterSMS(m.MDB, mobile)
	if err != nil {
		return "", err
	}
	return code, err
}

func (m *MeanController) ValidateSMSCode(mobile, code string) (Dungeons, error) {
	smsAccount, err := GetSMSAccountByPhoneNumber(m.MDB, mobile)
	if err != nil {
		return nil, err
	}
	if smsAccount == nil || smsAccount.Code != code {
		return nil, InvalidSecretCodeErr
	}

	r := make(Dungeons)
	r["secret"] = smsAccount.Secret

	return r, nil
}
