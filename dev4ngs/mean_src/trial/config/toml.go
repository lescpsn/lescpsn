package config

import (
	"github.com/BurntSushi/toml"
)

type Httprequest map[string]interface{}

type TomlConfig struct {
	Title        string
	RequetHost   map[string]string
	Token        map[string]string
	ApiTestArray map[string]interface{}
	HttpRequest  []Httprequest
}

func GetApi() (*TomlConfig, error) {
	var config TomlConfig
	if _, err := toml.DecodeFile("api.toml", &config); err != nil {
		return nil, err
	}
	return &config, nil
}
