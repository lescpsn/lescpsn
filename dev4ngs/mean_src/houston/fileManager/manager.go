// This file "uploadr" is created by Lincan Li at 11/23/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package fileManager

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"git.ngs.tech/mean/houston/config"
	"qiniupkg.com/api.v7/kodo"
	"time"
)

// QiNiu access key
const accessKey = "X0W-1LWpcdD0eOQr0MUwOz1hQvuAPYxR9XAzbzHf"

// QiNiu secret key
const secretKey = "9AsdeMKGYlvBHduCZX-NTOyAXz9TLvNrC62yjcIp"

// QiNiu uploadr call back url
const callbackDomain = `http://api.dev.tusoapp.com:8080/`

const bucketName = "tuso"
const bucketURL = "7xodxr.com2.z0.glb.qiniucdn.com"

type MeanFileManager struct {
	defaultZone   int
	secondaryZone int
	bucketName    string
	Client        *kodo.Client
	Bucket        *kodo.Bucket
}

var c *config.QiNiuConfig

func NewFileManager() *MeanFileManager {
	//获取配置
	c = config.GetQiNiuConfig()

	defaultZone := 0
	secondaryZone := 1

	kodo.SetMac(c.AccessKey, c.SecretKey)
	kodo.SetAppName("Tuso")

	client := kodo.New(defaultZone, nil)
	bucket := client.Bucket(c.BucketName)

	fileManager := &MeanFileManager{
		defaultZone:   defaultZone,
		secondaryZone: secondaryZone,
		bucketName:    c.BucketName,
		Client:        client,
		Bucket:        &bucket,
	}

	return fileManager
}

func (f *MeanFileManager) GetBucketName() string {
	return f.bucketName
}

// UpToken generate upload token
func (f *MeanFileManager) UpToken(callbackURL string) (string, time.Time) {
	callbackBody := "bucket=$(bucket)&key=$(key)&hash=$(etag)&fsize=$(fsize)&width=$(x:width)&height=$(x:height)&exif=$(x:exif)&privacy=$(x:privacy)&md5=$(x:md5)&primary_color=$(x:primary_color)&geolocation=$(x:geolocation)&edit_params=$(x:edit_params)&timestamp=$(x:timestamp)&ut=$(x:ut)"

	baseTime := time.Now()
	date := baseTime.Add(2 * time.Hour)

	putPolicy := &kodo.PutPolicy{
		Scope:            f.bucketName,
		CallbackUrl:      c.CallbackDomain + callbackURL,
		CallbackBody:     callbackBody,
		CallbackBodyType: "application/x-www-form-urlencoded",
		Expires:          uint32(date.Unix()),
	}

	return f.Client.MakeUptoken(putPolicy), date
}

func (f *MeanFileManager) FileStat(key string) (int64, error) {
	entry, err := f.Bucket.Stat(nil, key)
	if err != nil {
		return 0, err
	}
	return entry.Fsize, nil
}

func (f *MeanFileManager) DeleteFile(key string) error {
	if err := f.Bucket.Delete(nil, key); err != nil {
		return err
	}
	return nil
}

func (f *MeanFileManager) MoveFile(key string, designatedKey string) error {
	if err := f.Bucket.Move(nil, key, designatedKey); err != nil {
		return err
	}
	return nil
}

func (f *MeanFileManager) CopyFile(key string, designatedKey string) error {
	if err := f.Bucket.Copy(nil, key, designatedKey); err != nil {
		return err
	}
	return nil
}

func (f *MeanFileManager) GetDownloadURL(key string) string {
	//	baseTime := time.Now()
	//	date := baseTime.Add(1 * time.Hour)

	//	policy := &kodo.GetPolicy{
	//		Expires: uint32(date.Unix()),
	//	}

	baseUrl := kodo.MakeBaseUrl(c.BucketURL, key)

	//	privateURL := f.Client.MakePrivateUrl(baseUrl, policy)
	return baseUrl
}

func (f *MeanFileManager) Base64BucketKey(key string) string {
	byteBucket := []byte(f.bucketName)
	byteKey := []byte(key)

	b := append(byteBucket, ":"...)
	b = append(byteBucket, byteKey...)

	return base64.URLEncoding.EncodeToString(b)
}

func (f *MeanFileManager) NewPipeline(key string) *ImagePipeline {
	return &ImagePipeline{
		fileManager: f,
		originKey:   key,
	}
}

func (f *MeanFileManager) GetAuthToken(s string) string {
	h := hmac.New(sha1.New, []byte(c.SecretKey))
	h.Write([]byte(s))
	sign := base64.URLEncoding.EncodeToString(h.Sum(nil))
	return c.AccessKey + ":" + sign
}
