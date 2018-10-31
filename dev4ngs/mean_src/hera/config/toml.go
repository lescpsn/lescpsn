package config

import (
	"github.com/BurntSushi/toml"
)

type TomlConfig struct {
	Title     string
	NickName  []string
	AvatarUrl []string
}

func GetAvatarConfig() (*TomlConfig, error) {
	var config TomlConfig
	if _, err := toml.DecodeFile("avatar.toml", &config); err != nil {
		return nil, err
	}
	return &config, nil
}
