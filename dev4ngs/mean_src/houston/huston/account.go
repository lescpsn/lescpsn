// This file "account.go" is created by Lincan Li at 11/15/2015
// Copyright Negative Space Tech LLC. All rights reserved.

package huston

import (
	"crypto/sha1"
	"fmt"
	"git.ngs.tech/mean/houston/email"
	. "git.ngs.tech/mean/houston/model"
	"git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (m *MeanController) CreateSchema() {

	Cl.CreateSchema(context.TODO(), &proto.Empty{})
}

// VerifyUsername 方法: 本方法用于验证用户传入的 username 是否合法和唯一, 如合法且唯一则返回{"validate":true}
func (m *MeanController) VerifyUsername(username string) (Dungeons, error) {
	var rsp *proto.UserResponse
	var err error

	if IsEmail(username) {
		rsp, err = Cl.GetUserByEmail(context.TODO(), &proto.GetUserByEmailRequest{
			Email: username,
		})
	}
	if IsMobile(username) {
		rsp, err = Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
			Mobile: username,
		})
	}
	if err != nil {
		return nil, err
	}

	d := make(Dungeons)
	if rsp == nil {
		return nil, InvalidUserNameErr
	}

	d[`validate`] = rsp.Null

	return d, nil
}

// RegisterByEmail 方法: 使用邮箱和密码进行用户注册, 需要注意的是邮箱需要满足此正则:
// 		`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`
// 而传入密码需要满足一下正则:
// 		xxx
// 如用户名已被注册则会返回错误.
func (m *MeanController) RegisterByEmail(email, password, device string) (Dungeons, error) {

	// TODO: password regular expression
	// 验证传入 邮箱号 是否合法
	if !IsEmail(email) {
		return nil, InvalidEmailAdressErr
	}

	if !IsPassword(password) {
		return nil, InvalidPasswordErr
	}

	rsp, err := Cl.GetUserByEmail(context.TODO(), &proto.GetUserByEmailRequest{
		Email: email,
	})
	if err != nil {
		return nil, err
	}
	if !rsp.Null {
		return nil, InvalidEmailAdressErr
	}

	rsp, err = Cl.NewEmailUser(context.TODO(), &proto.PostAccountRequest{
		Username: email,
		Password: password,
		Status:   proto.Status_user_status_activated,
	})
	if err != nil {
		return nil, err
	}
	user := rsp.User
	// TODO
	InsertUserToken(user.ID, user.Token.GetString())
	InsertDeviceToken(user.ID, device)

	uData, err := UserToData(user, &UserDataOption{FillSensitive: true, FillToken: true})
	if err != nil {
		return nil, err
	}

	return uData, nil
}

// RegisterByMobile 方法: 使用手机号和密码进行用户注册, 需要注意的是手机号需要满足此正则:
// 		`^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$`
// 而传入密码需要满足一下正则:
// 		xxx
// 如用户名已被注册则会返回错误.
func (m *MeanController) RegisterByMobile(mobile, password, secret, device string) (Dungeons, error) {

	// 验证传入 电话号 是否合法
	if !IsMobile(mobile) {
		return nil, InvalidPhoneNumberErr
	}

	if !IsPassword(password) {
		return nil, InvalidPasswordErr
	}
	getURsp, err := Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
		Mobile: mobile,
	})
	if err != nil {
		return nil, err
	}
	user := getURsp.User

	if !getURsp.Null {
		return nil, InvalidPhoneNumberErr
	}

	smsAccount, err := GetSMSAccountByPhoneNumber(m.MDB, mobile)
	if smsAccount == nil || smsAccount.Secret != secret {
		return nil, InvalidSecretCodeErr
	}
	smsAccount.Delete(m.MDB)

	newMRsp, errors := Cl.NewMobileUser(context.TODO(), &proto.PostAccountRequest{
		Username: mobile,
		Password: password,
		Status:   proto.Status_user_status_activated,
	})
	if errors != nil {
		return nil, errors
	}
	user = newMRsp.User

	InsertUserToken(user.ID, user.Token.GetString())
	InsertDeviceToken(user.ID, device)

	uData, err := UserToData(user, &UserDataOption{FillSensitive: true, FillToken: true})
	if err != nil {
		return nil, err
	}

	return uData, nil
}

// Login 方法: 登陆方法, 用户通过传入的 用户名(可为邮箱和手机号) 和 密码进行登陆
func (m *MeanController) Login(username, password, dToken string) (Dungeons, error) {
	if IsEmail(username) {
		return m.LoginByEmail(username, password, dToken)
	}

	if IsMobile(username) {
		return m.LoginByPhoneNumber(username, password, dToken)
	}

	return nil, InvalidUserNameErr
}

// LoginByEmail 方法: 通过 邮箱 和 密码 进行用户登录, 同时, 登陆成功会保存用户的DeviceToken.
func (m *MeanController) LoginByEmail(email, password, dToken string) (Dungeons, error) {

	getURsp, err := Cl.GetUserByEmail(context.TODO(), &proto.GetUserByEmailRequest{
		Email: email,
	})
	if err != nil {
		return nil, err
	}
	if getURsp.Null {
		return nil, InvalidEmailAdressErr
	}

	if !IsPassword(password) {
		return nil, InvalidPasswordErr
	}
	u := getURsp.User
	h := sha1.New()
	h.Write([]byte(u.Salt.GetString() + password))
	bs := fmt.Sprintf("%x", h.Sum(nil))

	if string(bs) != u.Password.GetString() {
		return nil, InvalidPasswordErr
	}
	_, err = InsertDeviceToken(u.ID, dToken)
	if err != nil {
		return nil, err
	}

	_, err = InsertUserToken(u.ID, u.Token.GetString())
	if err != nil {
		return nil, err
	}

	uData, err := UserToData(u, &UserDataOption{FillSensitive: true, FillToken: true})
	if err != nil {
		return nil, err
	}

	return uData, nil
}

// LoginByEmail 方法: 通过 手机号 和 密码 进行用户登录, 同时, 登陆成功会保存用户的DeviceToken.
func (m *MeanController) LoginByPhoneNumber(phoneNumber, password, dToken string) (Dungeons, error) {

	getURsp, err := Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
		Mobile: phoneNumber,
	})
	if err != nil {
		return nil, err
	}
	if getURsp.Null {
		return nil, InvalidPhoneNumberErr
	}

	if !IsPassword(password) {
		return nil, InvalidPasswordErr
	}

	u := getURsp.User

	h := sha1.New()
	h.Write([]byte(u.Salt.GetString() + password))
	bs := fmt.Sprintf("%x", h.Sum(nil))

	if string(bs) != u.Password.GetString() {
		return nil, InvalidPasswordErr
	}

	_, err = InsertDeviceToken(u.ID, dToken)
	if err != nil {
		return nil, err
	}

	_, err = InsertUserToken(u.ID, u.Token.GetString())
	if err != nil {
		return nil, err
	}

	uData, err := UserToData(u, &UserDataOption{FillSensitive: true, FillToken: true})
	if err != nil {
		return nil, err
	}

	return uData, nil
}

// SendForgetPassCodeSms 方法: 发送邮箱验证码
func (m *MeanController) SendForgetPassCodeEmail(address, secret string) error {
	msg := email.NewCommonMsg()
	err := msg.Send(address, secret, "send code ")
	if err != nil {
		return err
	}
	return nil
}

// SendForgetPassCodeSms 方法: 发送短信验证码
func (m *MeanController) SendForgetPassCodeSms(phone, secret string) error {
	msg := NewSMSManager()
	err := msg.sendTemplateSMS(phone, "【图说Tuso】您的验证码是: "+secret+" ，验证码有效期为 10 分钟")
	if err != nil {
		return err
	}
	return nil
}

//UpdatePassByCode 根据验证码更新用户密码
func (m *MeanController) UpdateNewPasswordSecrets(UserName string) (Dungeons, error) {

	var rsp *proto.UserResponse
	var err error

	if IsEmail(UserName) {
		rsp, err = Cl.GetUserByEmail(context.TODO(), &proto.GetUserByEmailRequest{
			Email: UserName,
		})
	}
	if IsMobile(UserName) {
		rsp, err = Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
			Mobile: UserName,
		})
	}
	if err != nil {
		return nil, err
	}
	if rsp.Null {
		return nil, UserNotFoundErr
	}
	user := rsp.User
	uSecrets, err := GetUserSecrets(m.MDB, Str2UUID(user.UUID))
	if err != nil {
		return nil, err
	}

	s := &Secret{
		UserSecretType: UserSecretTypeNewPassword,
		Code:           RandomNumber(6),
		Secret:         RandomString(32),
	}

	uSecrets, err = uSecrets.AppendSecret(m.MDB, s)
	if err != nil {
		return nil, err
	}

	if IsMobile(UserName) {
		if err = m.SendForgetPassCodeSms(UserName, string(s.Code)); err != nil {
			return nil, err
		}
	}
	if IsEmail(UserName) {
		if err = m.SendForgetPassCodeEmail(UserName, s.Secret); err != nil {
			return nil, err
		}
	}
	return nil, nil
}

func (m *MeanController) ValidateNewPasswordCode(UserName, code string) (Dungeons, error) {

	var rsp *proto.UserResponse
	var err error

	if IsEmail(UserName) {
		rsp, err = Cl.GetUserByEmail(context.TODO(), &proto.GetUserByEmailRequest{
			Email: UserName,
		})
	}
	if IsMobile(UserName) {
		rsp, err = Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
			Mobile: UserName,
		})
	}
	if err != nil {
		return nil, err
	}
	if rsp.Null {
		return nil, UserNotFoundErr
	}
	user := rsp.User
	uSecrets, err := GetUserSecrets(m.MDB, Str2UUID(user.UUID))
	if err != nil {
		return nil, err
	}
	s, err := uSecrets.GetSecretForNewPassword(m.MDB)
	if err != nil {
		return nil, err
	}

	d := make(Dungeons)
	d[`validated`] = code == s.Code

	return d, nil
}

//UpdatePassByCode 根据验证码更新用户密码
func (m *MeanController) UpdatePassByCode(aName, password, sString string) (Dungeons, error) {

	var rsp *proto.UserResponse
	var err error

	if IsEmail(aName) {
		rsp, err = Cl.GetUserByEmail(context.TODO(), &proto.GetUserByEmailRequest{
			Email: aName,
		})
	}
	if IsMobile(aName) {
		rsp, err = Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
			Mobile: aName,
		})
	}
	if err != nil {
		return nil, err
	}
	if rsp.Null {
		return nil, UserNotFoundErr
	}
	user := rsp.User
	uSecrets, err := GetUserSecrets(m.MDB, Str2UUID(user.UUID))
	if err != nil {
		return nil, err
	}
	secrets, err := uSecrets.GetSecretForNewPassword(m.MDB)
	if err != nil {
		return nil, err
	}
	if secrets.Secret != sString {
		return nil, InvalidSecretCodeErr
	}
	Cl.PatchUserPassword(context.TODO(), &proto.PutUserPasswordRequest{
		UUID:     user.UUID,
		Password: password,
	})

	uSecrets.RemoveSecretsByType(m.MDB, UserSecretTypeNewPassword)

	uData, err := UserToData(user, &UserDataOption{FillSensitive: true, FillToken: true})
	if err != nil {
		return nil, err
	}
	return uData, nil
}

func (m *MeanController) DeleteAngle(username string) (bool, error) {

	rsp, err := Cl.GetUserByMobileNumber(context.TODO(), &proto.GetUserByMobileRequest{
		Mobile: username,
	})
	if err != nil {
		return false, err
	}
	if rsp.Null {
		return false, UserNotFoundErr
	}
	_, err = Cl.DeleteUserByPhone(context.TODO(), &proto.PhoneRequest{
		Phone: username,
	})
	if err != nil {
		return false, err
	}

	return true, nil
}
