// This file "config.go" is created by Lincan Li at 6/22/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package service

//七牛的错误处理包确实不错,所以就引用他们的了
import (
	"qiniupkg.com/x/errors.v7"
)

const (
	ZIPKIN_ADDRESS  = "ENV_ZIPKIN_ADDR"
	KAFKA_ADDR      = "ENV_KAFKA_ADDR"
	REDIS_ADDRESSES = "ENV_REDIS_ADDR"
	REDIS_PORT      = "ENV_REDIS_PORT"
	MGO_ADDRESSES   = "ENV_MGO_ADDR"
	MGO_PORT        = "ENV_MGO_PORT"
	MGO_DATABASE    = "ENV_MGO_SMS_DATABASE"
	MGO_USERNAME    = "ENV_MGO_USERNAME"
	MGO_PASSWORD    = "ENV_MGO_PASSWORD"
)

func Conf_GetValue(key string) string {
	//val为默认传出的字符.默认值
	return conf.Get(key).String("")
}

func Conf_GetValues(key string) []string {
	var vals []string
	return conf.Get(key).StringSlice(vals)
}

func GetRedisAddr() (string, error) {
	if conf == nil {
		return "", errors.New("config is nil")
	}
	addr := conf.Get(REDIS_ADDRESSES).String("127.0.0.1")
	port := conf.Get(REDIS_PORT).String(":6379")
	return addr + port, nil
}
