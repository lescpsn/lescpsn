package route

import (
	"git.ngs.tech/mean/hope/service"
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
	addr, err := service.GetRedisAddr()
	if err != nil {
		panic(err)
	}
	rClient = redis.NewClient(&redis.Options{
		Addr: addr,
		DB:   0,
	})
	return rClient
}
