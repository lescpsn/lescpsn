// This file "struct.go" is created by Lincan Li at 3/1/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package config

type DreamConfig struct {
	Address      string
	Port         string
	Username     string
	Password     string
	DatabaseName string
	SSLMode      string
}

type MongoConfig struct {
	Address  string
	Port     string
	Username string
	Password string
}

type QiNiuConfig struct {
	AccessKey      string
	SecretKey      string
	BucketName     string
	BucketURL      string
	CallbackDomain string
}

type HansConfig struct {
	Address string
	Port    string
	Dream   *DreamConfig
}

type PhoenixConfig struct {
	Address string
	Port    string
	Redis   *RedisConfig
	Dream   *DreamConfig
}

type RedisConfig struct {
	RedisPort string
	RedisHost string
}

type KafkaConfig struct {
	Topic      string
	CHRoot     string
	KafkaNodes []string
	ZooKeeper  []string
}

type WechatConfig struct {
	AppID     string
	AppSecret string
}

var (
	d *DreamConfig
	m *MongoConfig
	h *HansConfig
	p *PhoenixConfig
	r *RedisConfig
	k *KafkaConfig
	q *QiNiuConfig
	w *WechatConfig
)

func GetDreamConf() *DreamConfig {
	if d == nil {
		d = LoadDreamConf()
	}
	return d
}

func LoadDreamConf() *DreamConfig {
	c := MustGet()

	return &DreamConfig{
		Address:      c.MustValue(`Dream`, `database_address`, `localhost`),
		Port:         c.MustValue(`Dream`, `database_port`, `17017`),
		Username:     c.MustValue(`Dream`, `database_username`, `mean`),
		Password:     c.MustValue(`Dream`, `database_password`, ``),
		DatabaseName: c.MustValue(`Dream`, `database_name`, `mean`),
		SSLMode:      c.MustValue(`Dream`, `database_ssl_mode`, `disable`),
	}
}

func GetWechatConfig() *WechatConfig {
	if w == nil {
		w = LoadWechatConfig()
	}
	return w
}

func LoadWechatConfig() *WechatConfig {
	c := MustGet()

	return &WechatConfig{
		AppID:     c.MustValue(`Wechat`, `app_id`, ``),
		AppSecret: c.MustValue(`Wechat`, `app_secret`, ``),
	}
}

func GetQiNiuConfig() *QiNiuConfig {
	if q == nil {
		q = LoadQiNiuConfig()
	}
	return q
}

func LoadQiNiuConfig() *QiNiuConfig {
	c := MustGet()

	return &QiNiuConfig{
		AccessKey:      c.MustValue(`QiNiu`, `access_key`, ``),
		SecretKey:      c.MustValue(`QiNiu`, `secret_key`, ``),
		BucketName:     c.MustValue(`QiNiu`, `bucket_name`, `tuso`),
		BucketURL:      c.MustValue(`QiNiu`, `bucket_url`, `7xodxr.com2.z0.glb.qiniucdn.com`),
		CallbackDomain: c.MustValue(`QiNiu`, `callback_domain`, `http://api.dev.tusoapp.com:8080/`),
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

func GetHansConf() *HansConfig {
	if h == nil {
		h = LoadHansConf()
	}
	return h
}

func LoadHansConf() *HansConfig {
	c := MustGet()

	return &HansConfig{
		Address: c.MustValue(`Hope`, `address`, `127.0.0.1`),
		Port:    c.MustValue(`Hope`, `port`, `:8100`),
		Dream:   GetDreamConf(),
	}
}

func GetPhoConf() *PhoenixConfig {
	if p == nil {
		p = LoadPhoConf()
	}
	return p
}

func LoadPhoConf() *PhoenixConfig {
	c := MustGet()

	return &PhoenixConfig{
		Address: c.MustValue(`Dream`, `address`, `localhost`),
		Port:    c.MustValue(`Dream`, `port`, `:8000`),
		Dream:   GetDreamConf(),
		Redis:   GetRedisConfig(),
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

func GetKafkaConfig() *KafkaConfig {
	if k == nil {
		k = LoadKafkaConfig()
	}
	return k
}

func LoadKafkaConfig() *KafkaConfig {
	c := MustGet()

	return &KafkaConfig{
		Topic:      c.MustValue("Kafka", "topic", "mean"),
		CHRoot:     c.MustValue("Kafka", "chroot", ""),
		KafkaNodes: c.MustValueArray(`Kafka`, `kafka_addresses`, `,`),
		ZooKeeper:  c.MustValueArray(`Kafka`, `zookeeper_addresses`, `,`),
	}
}
