// This file "micro.go" is created by Lincan Li at 6/15/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package service

const (
	ZIPKIN_ADDRESS = "ENV_ZIPKIN_ADDR"
	RDB_ADDRESSES  = "ENV_RDB_ADDR"
	RDB_PORT       = "ENV_RDB_PORT"
	RDB_DB_NAME    = "ENV_RDB_DB_NAME"
	RDB_USERNAME   = "ENV_RDB_USERNAME"
	RDB_PASSWORD   = "ENV_RDB_PASSWORD"
	RDB_SSL_MODE   = "ENV_RDB_SSL_MODE"
)

func Conf_GetValue(key string) string {
	var val string
	return conf.Get(key).String(val)
}

func Conf_GetValues(key string) []string {
	var vals []string
	return conf.Get(key).StringSlice(vals)
}
