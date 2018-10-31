// This file "struct.go" is created by Lincan Li at 3/1/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package config

type MongoConfig struct {
	Address  string
	Port     string
	Username string
	Password string
}

type KafkaConfig struct {
	Topic         string
	CHRoot        string
	ConsumerGroup string
	KafkaNodes    []string
	ZooKeeper     []string
}

type AthenaConfig struct {
	Address string
	Port    string
}

var (
	a *AthenaConfig
	m *MongoConfig
	k *KafkaConfig
	r *RedisConfig
)

type RedisConfig struct {
	RedisPort string
	RedisHost string
}

func GetAthenaConf() *AthenaConfig {
	if a == nil {
		a = LoadAthenaConf()
	}
	return a
}

func LoadAthenaConf() *AthenaConfig {
	c := MustGet()

	return &AthenaConfig{
		Address: c.MustValue(`Athena`, `address`, `127.0.0.1`),
		Port:    c.MustValue(`Athena`, `port`, `:8201`),
	}
}
func GetRedisConfig() *RedisConfig {
	if r == nil {
		r = LoadRedisConfig()
	}
	return r
}

func LoadRedisConfig() *RedisConfig {
	c := MustGet()

	return &RedisConfig{
		RedisHost: c.MustValue(`Redis`, `redis_host`, ``),
		RedisPort: c.MustValue(`Redis`, `redis_port`, `:6379`),
	}
}
func GetMongoConf() *MongoConfig {
	if m == nil {
		m = LoadMongoConf()
	}
	return m
}

func LoadMongoConf() *MongoConfig {
	c := MustGet()

	return &MongoConfig{
		Address:  c.MustValue(`Mongo`, `database_address`, `localhost`),
		Port:     c.MustValue(`Mongo`, `database_port`, `17017`),
		Username: c.MustValue(`Mongo`, `database_username`, ``),
		Password: c.MustValue(`Mongo`, `database_password`, ``),
	}
}

func GetKafkaConfig() *KafkaConfig {
	if k == nil {
		k = LoadKafkaConfig()
	}
	return k
}

func LoadKafkaConfig() *KafkaConfig {
	c := MustGet()

	return &KafkaConfig{
		Topic:         c.MustValue("Kafka", "topic", "mean"),
		CHRoot:        c.MustValue("Kafka", "chroot", ""),
		KafkaNodes:    c.MustValueArray(`Kafka`, `kafka_addresses`, `,`),
		ZooKeeper:     c.MustValueArray(`Kafka`, `zookeeper_addresses`, `,`),
		ConsumerGroup: c.MustValue(`Kafka`, `consumer_group`, `mean_group`),
	}
}
