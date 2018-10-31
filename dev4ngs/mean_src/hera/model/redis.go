// This file "redis.go" is created by Lincan Li at 5/11/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	"git.ngs.tech/mean/hera/config"
	"gopkg.in/redis.v3"
)

var (
	rClient *redis.Client
)

func GetRedis() *redis.Client {
	if rClient == nil {
		rClient = connRedis()
	}
	return rClient
}

func connRedis() *redis.Client {
	config := config.GetRedisConfig()
	rClient = redis.NewClient(&redis.Options{
		Addr: config.RedisHost + config.RedisPort,
		DB:   0,
	})
	return rClient
}
