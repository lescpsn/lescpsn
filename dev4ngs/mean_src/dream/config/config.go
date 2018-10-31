// This file "config.go" is created by Lincan Li at 3/1/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package config

import (
	"errors"
	"github.com/Unknwon/goconfig"
)

var c *goconfig.ConfigFile
var fileDir string

const DocIndexName = "tuso"

func GetConfig(fDir string) *goconfig.ConfigFile {
	if c == nil {
		c = LoadConfig(fDir)
	}
	return c
}

func LoadConfig(fDir string) *goconfig.ConfigFile {
	fileDir = fDir

	config, err := goconfig.LoadConfigFile(fileDir)
	if err != nil {
		panic(err)
	}

	c = config
	return config
}

func MustGet() *goconfig.ConfigFile {
	if c == nil {
		panic(errors.New("nil config"))
	}
	return c
}

func Reload() *goconfig.ConfigFile {
	return LoadConfig(fileDir)
}
