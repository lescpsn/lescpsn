// This file "persistent" is created by Lincan Li at 1/27/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package fileManager

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/satori/go.uuid"
	"io/ioutil"
	"log"
	"net/http"
	"qiniupkg.com/api.v7/kodo"
)

const (
	imagePipelineCallbackURL = "vbr/photo_pipeline"
	PFOP_URL                 = "http://api.qiniu.com/pfop"
)

type ImagePipeline struct {
	fileManager *MeanFileManager
	originKey   string
	Key         string

	PersistentStrings []string
	persistentOps     string
}

func (i *ImagePipeline) AppendPersistent(a string) []string {
	if a != "" {
		i.PersistentStrings = append(i.PersistentStrings, a)
	}
	return i.PersistentStrings
}

func (i *ImagePipeline) SaveAs() string {
	i.Key = uuid.NewV4().String() + ".jpg"
	return i.Key
}

func (i *ImagePipeline) LiteImageParameter() string {
	var byteURL []byte

	byteURL = append(byteURL, "imageMogr2"...)
	byteURL = append(byteURL, "/auto-orient"...)
	byteURL = append(byteURL, "/strip"...)

	return string(byteURL)
}

func (i *ImagePipeline) GenerateLiteImageURL(key string) string {
	baseURL := kodo.MakeBaseUrl(c.BucketURL, key)

	byteURL := []byte(baseURL)
	byteURL = append(byteURL, "?"...)

	lip := i.LiteImageParameter()
	byteURL = append(byteURL, lip...)

	return string(byteURL)
}

type Pupa map[string]interface{}
type Butterfly map[string]interface{}

func (i *ImagePipeline) FilterImage(b Butterfly) string {
	sJSON, err := json.Marshal(b)
	if err != nil {
		log.Println("err in filter image json conversion: ", err)
		return ""
	}

	return base64.URLEncoding.EncodeToString(sJSON)
}

func (i *ImagePipeline) CropImage(b Pupa) string {
	sJSON, err := json.Marshal(b)
	if err != nil {
		log.Println("err in crop image json conversion: ", err)
		return ""
	}

	log.Println("sJSON for crop", string(sJSON))

	return base64.URLEncoding.EncodeToString(sJSON)
}

func (i *ImagePipeline) EditImageParameter(p Pupa, b Butterfly) string {
	var byteParams []byte

	if p == nil && b == nil {
		return ""
	}

	byteParams = append(byteParams, "tuso_filter/"...)

	if p != nil && b != nil {
		byteParams = append(byteParams, "2,"...)
		byteParams = append(byteParams, i.CropImage(p)...)
		byteParams = append(byteParams, ","...)
		byteParams = append(byteParams, i.FilterImage(b)...)

	} else if p != nil {
		byteParams = append(byteParams, "0,"...)
		byteParams = append(byteParams, i.CropImage(p)...)

	} else if b != nil {
		byteParams = append(byteParams, "1,"...)
		byteParams = append(byteParams, i.FilterImage(b)...)
	}

	return string(byteParams)
}

func (i *ImagePipeline) GenerateEditImageURL(key string, p Pupa, b Butterfly) string {
	baseURL := kodo.MakeBaseUrl(c.BucketURL, key)

	byteURL := []byte(baseURL)
	byteURL = append(byteURL, "?"...)

	eip := i.EditImageParameter(p, b)
	byteURL = append(byteURL, eip...)

	return string(byteURL)
}

func (i *ImagePipeline) GetPersistedOps() string {
	var persistentOps []byte

	for index, op := range i.PersistentStrings {
		if index != 0 {
			persistentOps = append(persistentOps, "|"...)
		}
		persistentOps = append(persistentOps, op...)
	}

	if i.Key != "" {
		bkey := i.fileManager.GetBucketName() + ":" + i.Key
		s := "|saveas/" + base64.URLEncoding.EncodeToString([]byte(bkey))
		persistentOps = append(persistentOps, s...)
	}

	i.persistentOps = string(persistentOps)

	return i.persistentOps
}

type PersistentRequestResponse struct {
	PersistentID string `json:"persistentId"`
	Error        string `json:"error"`
}

func (i *ImagePipeline) Put() (string, error) {
	s := "bucket=" + i.fileManager.GetBucketName() + "&key=" + i.originKey + "&fops=" + i.persistentOps + "&notifyURL=" + c.CallbackDomain + imagePipelineCallbackURL
	keyAuth := i.fileManager.GetAuthToken("/pfop\n" + s)

	request, err := http.NewRequest("POST", PFOP_URL, bytes.NewBuffer([]byte(s)))
	request.Header.Set("Host", "api.qiniu.com")
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.Header.Set("Authorization", "QBox "+keyAuth)

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		return "", err
	}

	contents, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	if err != nil {
		return "", err
	}

	if response.Status != "200 OK" {
		return "", fmt.Errorf(string(contents))
	}

	var prr PersistentRequestResponse
	if err := json.Unmarshal(contents, &prr); err != nil {
		return "", err
	}

	if prr.Error != "" {
		return "", err
	}

	return prr.PersistentID, nil
}
