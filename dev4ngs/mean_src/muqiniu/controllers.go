// This file "controllers.go" is created by Lincan Li at 5/13/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package main

import (
	"github.com/gin-gonic/gin"
	"github.com/satori/go.uuid"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"encoding/json"
	"bytes"
	"time"
)

type Upload struct {
	Token        string `form:"user" binding:"required"`
	File         string `form:"file"`
	CallbackURL  string `form:"x:callback_url" binding:"required"`
	UT           string `form:"x:ut" binding:"required"`
	Privacy      string `form:"x:privacy"  binding:"required"`
	MD5          string `form:"x:md5" binding:"required"`
	PrimaryColor string `form:"x:primary_color"  binding:"required"`
	Geolocation  string `form:"x:geolocation" binding:"required"`
	EditParams   string `form:"x:edit_params" binding:"required"`
	TimeStamp    string `form:"x:timestamp" binding:"required"`
	Width        string `form:"x:width" binding:"required"`
	Height       string `form:"x:height" binding:"required"`
}

func UploadHandler(g *gin.Engine) {
	g.GET(UploadCallBack, func(c *gin.Context) {
		var u Upload

		if err := c.Bind(&u); err != nil {
			panic(err)
		}

		form := url.Values{}
		form.Add("bucket", "tuso")
		form.Add("key", uuid.NewV4().String())
		form.Add("privacy", u.Privacy)
		form.Add("fsize", strconv.Itoa(1024*50))
		form.Add("md5", u.MD5)
		form.Add("primary_color", u.PrimaryColor)
		form.Add("geolocation", u.Geolocation)
		form.Add("edit_params", u.EditParams)
		form.Add("timestamp", u.TimeStamp)
		form.Add("ut", u.UT)
		form.Add("width", u.Width)
		form.Add("height", u.Height)
		form.Add("exif", `{}`)

		_, err := http.NewRequest("POST", u.CallbackURL, strings.NewReader(form.Encode()))
		if err != nil {
			panic(err)
		}
	})
}

type Pipeline struct {
	Bucket      string `form:"bucket"`
	Key         string `form:"key"`
	CallbackURL string `form:"notifyURL"`
}

type PersistentRequestResponse struct {
	PersistentID string `json:"persistentId"`
	Error        string `json:"error"`
}


type PersistentCallBack struct {
	PersistentID string                    `json:"id"`
	Code         int                       `json:"code"`
	Description  string                    `json:"desc"`
	InputKey     string                    `json:"inputKey"`
	InputBucket  string                    `json:"inputBucket"`
	Items        []*PersistentActionResult `json:"items"`
}

type PersistentActionResult struct {
	CMD         string `json:"cmd"`
	Code        int    `json:"code"`
	Description string `json:"desc"`
	Error       string `json:"error"`
	Hash        string `json:"hash"`
	Key         string `json:"key"`
	ReturnOld   int    `json:"returnOld"`
}

func PipelineHandler(g *gin.Engine) {
	g.GET(PipelineCallback, func(c *gin.Context) {
		var p Pipeline

		if err := c.Bind(&p); err != nil {
			panic(err)
		}

		pID := uuid.NewV4().String()

		prp := &PersistentRequestResponse {
			PersistentID: pID,
			Error: "",
		}

		go func() {
			time.Sleep(2 * time.Second)

			pcb := &PersistentCallBack{
				PersistentID: pID,
				Code:         0,
				Description:  "",
				InputKey:     p.Key,
				InputBucket:  p.Bucket,
				Items: []*PersistentActionResult{
					&PersistentActionResult{
						CMD: "",
					},
				},
			}

			pcjJSONString, err := json.Marshal(pcb)
			if err != nil {
				panic(err)
			}

			_, err = http.NewRequest("POST", p.CallbackURL, bytes.NewBuffer(pcjJSONString))
			if err != nil {
				panic(err)
			}
		}()

		c.JSON(200, prp)
	})
}
