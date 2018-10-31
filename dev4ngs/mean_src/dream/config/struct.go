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

type QiNiuConfig struct {
	BucketName string
	BucketURL  string
}

type ElasticConfig struct {
	HostAddr string
	HostPort string
}

var (
	d *DreamConfig
	q *QiNiuConfig
	e *ElasticConfig
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

func GetQiNiuConfig() *QiNiuConfig {
	if q == nil {
		q = LoadQiNiuConfig()
	}
	return q
}

func LoadQiNiuConfig() *QiNiuConfig {
	c := MustGet()

	return &QiNiuConfig{
		BucketName: c.MustValue(`QiNiu`, `bucket_name`, `tuso`),
		BucketURL:  c.MustValue(`QiNiu`, `bucket_url`, `7xodxr.com2.z0.glb.qiniucdn.com`),
	}
}

func GetElasticConfig() *ElasticConfig {
	if e == nil {
		el := "Elastic"
		e = &ElasticConfig{
			HostAddr: c.MustValue(el, "host_address", "http://localhost:9200"),
		}
	}
	return e
}
