// This file "config.go" is created by Lincan Li at 6/22/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package service

import "log"

const (
	ZIPKIN_ADDRESS = "ENV_ZIPKIN_ADDR"
	KAFKA_ADDRESS  = "ENV_KAFKA_ADDR"
	MGO_ADDRESSES  = "ENV_MGO_ADDR"
	MGO_PORT       = "ENV_MGO_PORT"
	MGO_DATABASE   = "ENV_MGO_SMS_DATABASE"
	MGO_USERNAME   = "ENV_MGO_USERNAME"
	MGO_PASSWORD   = "ENV_MGO_PASSWORD"
)

func Conf_GetValue(key string) string {
	var val string
	log.Println()
	dest := conf.Get(key).String(val)
	log.Println("val string: ", val, " dest string, ", dest)
	return dest
}

func Conf_GetValues(key string) []string {
	var vals []string
	conf.Get(key).StringSlice(vals)
	return vals
}
